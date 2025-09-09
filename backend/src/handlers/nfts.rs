use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde_json::{json, Value};

use super::AppState;
use crate::{
    error::AppError,
    models::{Activity, ActivityQuery, Nft, NftListQuery},
};

pub async fn list_nfts(
    State(state): State<AppState>,
    Query(query): Query<NftListQuery>,
) -> Result<Json<Value>, AppError> {
    let nfts = Nft::list(&state.db, query.clone()).await?;
    let total = Nft::count(&state.db, &query).await?;

    Ok(Json(json!({
        "nfts": nfts,
        "pagination": {
            "total": total,
            "page": query.page.unwrap_or(0),
            "limit": query.limit.unwrap_or(20),
            "has_more": (query.page.unwrap_or(0) + 1) * query.limit.unwrap_or(20) < total
        }
    })))
}

pub async fn get_nft(
    State(state): State<AppState>,
    Path(mint): Path<String>,
) -> Result<Json<Value>, AppError> {
    let nft = Nft::find_by_mint(&state.db, &mint)
        .await?
        .ok_or_else(|| crate::error::not_found_error("NFT"))?;

    Ok(Json(json!({
        "nft": nft
    })))
}

pub async fn get_nft_activities(
    State(state): State<AppState>,
    Path(mint): Path<String>,
    Query(query): Query<ActivityQuery>,
) -> Result<Json<Value>, AppError> {
    let mut activity_query = query;
    activity_query.nft_mint = Some(mint);

    let activities = Activity::list(&state.db, activity_query).await?;

    Ok(Json(json!({
        "activities": activities
    })))
}
