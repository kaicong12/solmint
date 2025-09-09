use reqwest::Client;
use serde_json::Value;
use std::time::Duration;

use crate::error::AppError;

pub struct MetadataService {
    client: Client,
}

impl MetadataService {
    pub fn new() -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .expect("Failed to create HTTP client");

        Self { client }
    }

    pub async fn fetch_nft_metadata(&self, metadata_uri: &str) -> Result<Value, AppError> {
        let response = self
            .client
            .get(metadata_uri)
            .send()
            .await
            .map_err(|e| AppError::Internal(format!("Failed to fetch metadata: {}", e)))?;

        if !response.status().is_success() {
            return Err(AppError::Internal(format!(
                "Metadata fetch failed with status: {}",
                response.status()
            )));
        }

        let metadata: Value = response
            .json()
            .await
            .map_err(|e| AppError::Internal(format!("Failed to parse metadata JSON: {}", e)))?;

        Ok(metadata)
    }

    pub async fn fetch_collection_metadata(&self, metadata_uri: &str) -> Result<Value, AppError> {
        self.fetch_nft_metadata(metadata_uri).await
    }
}

impl Default for MetadataService {
    fn default() -> Self {
        Self::new()
    }
}
