use axum::{extract::Query, extract::State, Json};
use serde::Deserialize;
use serde_json::{json, Value};

use super::AppState;
use crate::{error::AppError, models::MarketplaceStats};

#[derive(Debug, Deserialize)]
pub struct StatsQuery {
    pub days: Option<i32>,
}

pub async fn get_marketplace_stats(State(state): State<AppState>) -> Result<Json<Value>, AppError> {
    let stats = MarketplaceStats::get_global_stats(&state.db).await?;

    Ok(Json(json!({
        "stats": stats
    })))
}

pub async fn get_daily_stats(
    State(state): State<AppState>,
    Query(query): Query<StatsQuery>,
) -> Result<Json<Value>, AppError> {
    let days = query.days.unwrap_or(30);
    let stats = MarketplaceStats::get_daily_stats(&state.db, days).await?;

    Ok(Json(json!({
        "daily_stats": stats
    })))
}
