use aws_config::Region;
use aws_sdk_s3::{presigning::PresigningConfig, Client};
use axum::{extract::State, response::Json};
use serde::{Deserialize, Serialize};
use std::time::Duration;
use uuid::Uuid;

use crate::{error::AppError, handlers::AppState};

#[derive(Debug, Deserialize)]
pub struct PresignedUrlRequest {
    pub filename: String,
    pub content_type: String,
}

#[derive(Debug, Serialize)]
pub struct PresignedUrlResponse {
    pub upload_url: String,
    pub image_url: String,
    pub key: String,
}

#[derive(Debug, Deserialize)]
pub struct MetadataUploadRequest {
    pub metadata: serde_json::Value,
}

#[derive(Debug, Serialize)]
pub struct MetadataUploadResponse {
    pub metadata_uri: String,
}

pub async fn generate_presigned_url(
    State(state): State<AppState>,
    Json(req): Json<PresignedUrlRequest>,
) -> Result<Json<PresignedUrlResponse>, AppError> {
    // Generate unique key for the file
    let file_extension = req
        .filename
        .split('.')
        .last()
        .unwrap_or("jpg")
        .to_lowercase();
    let unique_key = format!("nft-images/{}.{}", Uuid::new_v4(), file_extension);

    // Create S3 client
    let config = aws_config::defaults(aws_config::BehaviorVersion::latest())
        .region(Region::new(state.config.s3_region.clone()))
        .load()
        .await;

    let s3_client = Client::new(&config);

    // Generate presigned URL for PUT operation
    let presigning_config = PresigningConfig::expires_in(Duration::from_secs(3600))
        .map_err(|e| AppError::AWSError(e.to_string()))?; // 1 hour

    let presigned_request = s3_client
        .put_object()
        .bucket(&state.config.s3_bucket)
        .key(&unique_key)
        .content_type(&req.content_type)
        .presigned(presigning_config)
        .await
        .map_err(|e| AppError::AWSError(e.to_string()))?;

    // Generate the public URL for the uploaded file
    let image_url = format!(
        "https://{}.s3.{}.amazonaws.com/{}",
        state.config.s3_bucket, state.config.s3_region, unique_key
    );

    Ok(Json(PresignedUrlResponse {
        upload_url: presigned_request.uri().to_string(),
        image_url,
        key: unique_key,
    }))
}

pub async fn upload_metadata(
    State(state): State<AppState>,
    Json(req): Json<MetadataUploadRequest>,
) -> Result<Json<MetadataUploadResponse>, AppError> {
    // Generate unique key for metadata
    let metadata_key = format!("nft-metadata/{}.json", Uuid::new_v4());

    // Create S3 client
    let config = aws_config::defaults(aws_config::BehaviorVersion::latest())
        .region(Region::new(state.config.s3_region.clone()))
        .load()
        .await;

    let s3_client = Client::new(&config);

    // Convert metadata to JSON string
    let metadata_json = serde_json::to_string_pretty(&req.metadata)?;

    // Upload metadata to S3
    s3_client
        .put_object()
        .bucket(&state.config.s3_bucket)
        .key(&metadata_key)
        .content_type("application/json")
        .body(metadata_json.into_bytes().into())
        .send()
        .await
        .map_err(|e| AppError::AWSError(e.to_string()))?;

    // Generate the public URL for the metadata
    let metadata_uri = format!(
        "https://{}.s3.{}.amazonaws.com/{}",
        state.config.s3_bucket, state.config.s3_region, metadata_key
    );

    Ok(Json(MetadataUploadResponse { metadata_uri }))
}

pub async fn health_check() -> Result<Json<serde_json::Value>, AppError> {
    Ok(Json(serde_json::json!({
        "status": "ok",
        "service": "upload"
    })))
}
