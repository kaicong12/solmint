use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde_json::{json, Value};
use uuid::Uuid;

use super::AppState;
use crate::{
    error::AppError,
    models::{Collection, CollectionQuery, Nft, NftListQuery},
};

pub async fn list_collections(
    State(state): State<AppState>,
    Query(query): Query<CollectionQuery>,
) -> Result<Json<Value>, AppError> {
    let collections = Collection::list(&state.db, query).await?;

    Ok(Json(json!({
        "collections": collections
    })))
}

pub async fn get_collection(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let collection = Collection::find_by_id(&state.db, id)
        .await?
        .ok_or_else(|| crate::error::not_found_error("Collection"))?;

    let stats = Collection::get_stats(&state.db, id).await?;

    Ok(Json(json!({
        "collection": collection,
        "stats": stats
    })))
}

pub async fn get_collection_nfts(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Query(mut query): Query<NftListQuery>,
) -> Result<Json<Value>, AppError> {
    query.collection_id = Some(id);
    
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
