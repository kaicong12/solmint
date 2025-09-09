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
    pub indexer_interval_seconds: u64,
    pub max_concurrent_requests: usize,
    pub cache_ttl_seconds: u64,
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
            indexer_interval_seconds: env::var("INDEXER_INTERVAL_SECONDS")
                .unwrap_or_else(|_| "10".to_string())
                .parse()
                .unwrap_or(10),
            max_concurrent_requests: env::var("MAX_CONCURRENT_REQUESTS")
                .unwrap_or_else(|_| "100".to_string())
                .parse()
                .unwrap_or(100),
            cache_ttl_seconds: env::var("CACHE_TTL_SECONDS")
                .unwrap_or_else(|_| "300".to_string())
                .parse()
                .unwrap_or(300),
        })
    }
}
