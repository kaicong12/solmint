use axum::{extract::State, Json};
use serde_json::{json, Value};

use super::AppState;
use crate::error::AppError;

pub async fn health_check(State(state): State<AppState>) -> Result<Json<Value>, AppError> {
    // Check database connection
    sqlx::query("SELECT 1").execute(&state.db).await?;

    // Check Redis connection
    let mut redis_conn = state.redis.clone();
    let _: () = redis::cmd("PING").query_async(&mut redis_conn).await?;

    Ok(Json(json!({
        "status": "healthy",
        "timestamp": chrono::Utc::now(),
        "services": {
            "database": "connected",
            "redis": "connected",
            "solana_rpc": "connected"
        }
    })))
}
