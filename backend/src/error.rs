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

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Configuration error: {0}")]
    ConfigError(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Authentication error: {0}")]
    Authentication(String),

    #[error("Authorization error: {0}")]
    Authorization(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Internal server error: {0}")]
    Internal(String),

    #[error("Rate limit exceeded")]
    RateLimit,

    #[error("Service unavailable: {0}")]
    ServiceUnavailable(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AppError::Database(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error"),
            AppError::Redis(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Cache error"),
            AppError::SolanaClient(_) => (StatusCode::BAD_GATEWAY, "Blockchain service error"),
            AppError::Serialization(_) => {
                (StatusCode::INTERNAL_SERVER_ERROR, "Serialization error")
            }
            AppError::Io(_) => (StatusCode::INTERNAL_SERVER_ERROR, "IO error"),
            AppError::ConfigError(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Configuration error"),
            AppError::Validation(ref msg) => (StatusCode::BAD_REQUEST, msg.as_str()),
            AppError::Authentication(ref msg) => (StatusCode::UNAUTHORIZED, msg.as_str()),
            AppError::Authorization(ref msg) => (StatusCode::FORBIDDEN, msg.as_str()),
            AppError::NotFound(ref msg) => (StatusCode::NOT_FOUND, msg.as_str()),
            AppError::BadRequest(ref msg) => (StatusCode::BAD_REQUEST, msg.as_str()),
            AppError::Internal(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error"),
            AppError::RateLimit => (StatusCode::TOO_MANY_REQUESTS, "Rate limit exceeded"),
            AppError::ServiceUnavailable(ref msg) => {
                (StatusCode::SERVICE_UNAVAILABLE, msg.as_str())
            }
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
            AppError::Serialization(_) => "serialization_error",
            AppError::Io(_) => "io_error",
            AppError::ConfigError(_) => "config_error",
            AppError::Validation(_) => "validation_error",
            AppError::Authentication(_) => "authentication_error",
            AppError::Authorization(_) => "authorization_error",
            AppError::NotFound(_) => "not_found",
            AppError::BadRequest(_) => "bad_request",
            AppError::Internal(_) => "internal_error",
            AppError::RateLimit => "rate_limit",
            AppError::ServiceUnavailable(_) => "service_unavailable",
        }
    }
}

// Helper function to create validation errors
pub fn validation_error(msg: &str) -> AppError {
    AppError::Validation(msg.to_string())
}

// Helper function to create not found errors
pub fn not_found_error(resource: &str) -> AppError {
    AppError::NotFound(format!("{} not found", resource))
}

// Helper function to create bad request errors
pub fn bad_request_error(msg: &str) -> AppError {
    AppError::BadRequest(msg.to_string())
}
