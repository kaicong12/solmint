use serde::Deserialize;
use std::env;

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub database_url: String,
    pub redis_url: String,
    pub solana_rpc_url: String,
    pub port: u16,
    pub jwt_secret: String,
    pub marketplace_program_id: String,
    pub s3_bucket: String,
    pub s3_region: String,
    pub aws_access_key_id: Option<String>,
    pub aws_secret_access_key: Option<String>,
}

impl Config {
    pub fn from_env() -> Result<Self, crate::error::AppError> {
        dotenvy::dotenv().ok();

        Ok(Config {
            database_url: env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgresql://localhost/solmint".to_string()),
            redis_url: env::var("REDIS_URL")
                .unwrap_or_else(|_| "redis://localhost:6379".to_string()),
            solana_rpc_url: env::var("SOLANA_RPC_URL")
                .unwrap_or_else(|_| "https://api.mainnet-beta.solana.com".to_string()),
            port: env::var("PORT")
                .unwrap_or_else(|_| "8080".to_string())
                .parse()
                .map_err(|_| crate::error::AppError::ConfigError("Invalid PORT".to_string()))?,
            jwt_secret: env::var("JWT_SECRET").unwrap_or_else(|_| "your-secret-key".to_string()),
            marketplace_program_id: env::var("MARKETPLACE_PROGRAM_ID")
                .unwrap_or_else(|_| "11111111111111111111111111111111".to_string()),
            s3_bucket: env::var("S3_BUCKET").unwrap_or_else(|_| "solmint-nft-assets".to_string()),
            s3_region: env::var("S3_REGION").unwrap_or_else(|_| "us-east-1".to_string()),
            aws_access_key_id: env::var("AWS_ACCESS_KEY_ID").ok(),
            aws_secret_access_key: env::var("AWS_SECRET_ACCESS_KEY").ok(),
        })
    }
}
