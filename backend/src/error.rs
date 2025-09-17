use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Redis error: {0}")]
    Redis(#[from] redis::RedisError),

    #[error("Solana client error: {0}")]
    SolanaClient(#[from] solana_client::client_error::ClientError),

    #[error("Solana pubsub error: {0}")]
    SolanaPubsub(#[from] solana_client::pubsub_client::PubsubClientError),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Deserialization error: {0}")]
    Deserialization(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Configuration error: {0}")]
    ConfigError(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Validation error: {0}")]
    ValidationError(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AppError::Database(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error"),
            AppError::Redis(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Cache error"),
            AppError::SolanaClient(_) => (StatusCode::BAD_GATEWAY, "Blockchain service error"),
            AppError::SolanaPubsub(_) => (StatusCode::BAD_GATEWAY, "Blockchain RPC error"),
            AppError::Serialization(_) => {
                (StatusCode::INTERNAL_SERVER_ERROR, "Serialization error")
            }
            AppError::Deserialization(_) => {
                (StatusCode::INTERNAL_SERVER_ERROR, "Deserialization error")
            }
            AppError::Io(_) => (StatusCode::INTERNAL_SERVER_ERROR, "IO error"),
            AppError::ConfigError(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Configuration error"),
            AppError::NotFound(ref msg) => (StatusCode::NOT_FOUND, msg.as_str()),
            AppError::BadRequest(ref msg) => (StatusCode::BAD_REQUEST, msg.as_str()),
            AppError::ValidationError(ref msg) => (StatusCode::BAD_REQUEST, msg.as_str()),
        };

        let body = Json(json!({
            "error": {
                "message": error_message,
                "type": self.error_type(),
            }
        }));

        (status, body).into_response()
    }
}

impl AppError {
    fn error_type(&self) -> &'static str {
        match self {
            AppError::Database(_) => "database_error",
            AppError::Redis(_) => "cache_error",
            AppError::SolanaClient(_) => "blockchain_error",
            AppError::SolanaPubsub(_) => "solana_pubsub_error",
            AppError::Serialization(_) => "serialization_error",
            AppError::Deserialization(_) => "deserialization_error",
            AppError::Io(_) => "io_error",
            AppError::ConfigError(_) => "config_error",
            AppError::NotFound(_) => "not_found",
            AppError::BadRequest(_) => "bad_request",
            AppError::ValidationError(_) => "validation_error",
        }
    }
}

// Helper function to create not found errors
pub fn not_found_error(resource: &str) -> AppError {
    AppError::NotFound(format!("{} not found", resource))
}

// Helper function to create bad request errors
pub fn bad_request_error(msg: &str) -> AppError {
    AppError::BadRequest(msg.to_string())
}
