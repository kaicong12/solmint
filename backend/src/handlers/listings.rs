use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde_json::{json, Value};

use super::AppState;
use crate::{
    error::AppError,
    models::{Listing, ListingQuery},
};

pub async fn list_listings(
    State(state): State<AppState>,
    Query(query): Query<ListingQuery>,
) -> Result<Json<Value>, AppError> {
    let listings = Listing::list_with_nft_info(&state.db, query.clone()).await?;
    let total = Listing::count(&state.db, &query).await?;

    Ok(Json(json!({
        "listings": listings,
        "pagination": {
            "total": total,
            "page": query.page.unwrap_or(0),
            "limit": query.limit.unwrap_or(20),
            "has_more": (query.page.unwrap_or(0) + 1) * query.limit.unwrap_or(20) < total
        }
    })))
}

pub async fn get_listing(
    State(state): State<AppState>,
    Path(listing_address): Path<String>,
) -> Result<Json<Value>, AppError> {
    let listing = Listing::find_by_address(&state.db, &listing_address)
        .await?
        .ok_or_else(|| crate::error::not_found_error("Listing"))?;

    Ok(Json(json!({
        "listing": listing
    })))
}
