use axum::{extract::Query, extract::State, Json};
use serde_json::{json, Value};

use super::AppState;
use crate::{error::AppError, models::{Sale, SaleQuery}};

pub async fn list_sales(
    State(state): State<AppState>,
    Query(query): Query<SaleQuery>,
) -> Result<Json<Value>, AppError> {
    let sales = Sale::list(&state.db, query).await?;

    Ok(Json(json!({
        "sales": sales
    })))
}
