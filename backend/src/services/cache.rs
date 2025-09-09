use redis::aio::MultiplexedConnection;
use serde::{Deserialize, Serialize};
use std::time::Duration;

use crate::error::AppError;

pub struct CacheService {
    redis: MultiplexedConnection,
    default_ttl: Duration,
}

impl CacheService {
    pub fn new(redis: MultiplexedConnection, default_ttl: Duration) -> Self {
        Self { redis, default_ttl }
    }

    pub async fn get<T>(&mut self, key: &str) -> Result<Option<T>, AppError>
    where
        T: for<'de> Deserialize<'de>,
    {
        let value: Option<String> = redis::cmd("GET")
            .arg(key)
            .query_async(&mut self.redis)
            .await?;

        match value {
            Some(json_str) => {
                let data = serde_json::from_str(&json_str)?;
                Ok(Some(data))
            }
            None => Ok(None),
        }
    }

    pub async fn set<T>(&mut self, key: &str, value: &T, ttl: Option<Duration>) -> Result<(), AppError>
    where
        T: Serialize,
    {
        let json_str = serde_json::to_string(value)?;
        let ttl_seconds = ttl.unwrap_or(self.default_ttl).as_secs();

        redis::cmd("SETEX")
            .arg(key)
            .arg(ttl_seconds)
            .arg(json_str)
            .query_async(&mut self.redis)
            .await?;

        Ok(())
    }

    pub async fn delete(&mut self, key: &str) -> Result<(), AppError> {
        redis::cmd("DEL")
            .arg(key)
            .query_async(&mut self.redis)
            .await?;

        Ok(())
    }

    pub async fn exists(&mut self, key: &str) -> Result<bool, AppError> {
        let exists: bool = redis::cmd("EXISTS")
            .arg(key)
            .query_async(&mut self.redis)
            .await?;

        Ok(exists)
    }

    pub async fn increment(&mut self, key: &str, by: i64) -> Result<i64, AppError> {
        let result: i64 = redis::cmd("INCRBY")
            .arg(key)
            .arg(by)
            .query_async(&mut self.redis)
            .await?;

        Ok(result)
    }

    pub async fn set_if_not_exists(&mut self, key: &str, value: &str, ttl: Duration) -> Result<bool, AppError> {
        let result: Option<String> = redis::cmd("SET")
            .arg(key)
            .arg(value)
            .arg("EX")
            .arg(ttl.as_secs())
            .arg("NX")
            .query_async(&mut self.redis)
            .await?;

        Ok(result.is_some())
    }

    // Helper methods for common cache patterns
    pub fn nft_key(mint_address: &str) -> String {
        format!("nft:{}", mint_address)
    }

    pub fn collection_key(collection_id: &str) -> String {
        format!("collection:{}", collection_id)
    }

    pub fn user_key(wallet_address: &str) -> String {
        format!("user:{}", wallet_address)
    }

    pub fn listings_key(page: i64, limit: i64, filters: &str) -> String {
        format!("listings:{}:{}:{}", page, limit, filters)
    }

    pub fn stats_key() -> String {
        "marketplace:stats".to_string()
    }
}
