use axum::{extract::Query, extract::State, Json};
use serde::Deserialize;
use serde_json::{json, Value};

use super::AppState;
use crate::error::AppError;

#[derive(Debug, Deserialize)]
pub struct SearchQuery {
    pub q: String,
    pub category: Option<String>, // "nfts", "collections", "users"
    pub limit: Option<i64>,
}

pub async fn search(
    State(state): State<AppState>,
    Query(query): Query<SearchQuery>,
) -> Result<Json<Value>, AppError> {
    let limit = query.limit.unwrap_or(20).min(100);
    let search_term = format!("%{}%", query.q);

    let mut results = json!({
        "nfts": [],
        "collections": [],
        "users": []
    });

    // Search NFTs
    if query.category.is_none() || query.category.as_deref() == Some("nfts") {
        let nfts = sqlx::query!(
            r#"
            SELECT n.*, c.name as collection_name
            FROM nfts n
            LEFT JOIN collections c ON n.collection_id = c.id
            WHERE n.name ILIKE $1 OR n.description ILIKE $1
            ORDER BY n.created_at DESC
            LIMIT $2
            "#,
            search_term,
            limit
        )
        .fetch_all(&state.db)
        .await?;

        results["nfts"] = json!(nfts);
    }

    // Search Collections
    if query.category.is_none() || query.category.as_deref() == Some("collections") {
        let collections = sqlx::query!(
            r#"
            SELECT * FROM collections
            WHERE name ILIKE $1 OR description ILIKE $1
            ORDER BY total_volume DESC
            LIMIT $2
            "#,
            search_term,
            limit
        )
        .fetch_all(&state.db)
        .await?;

        results["collections"] = json!(collections);
    }

    // Search Users
    if query.category.is_none() || query.category.as_deref() == Some("users") {
        let users = sqlx::query!(
            r#"
            SELECT * FROM users
            WHERE username ILIKE $1 OR wallet_address ILIKE $1
            ORDER BY created_at DESC
            LIMIT $2
            "#,
            search_term,
            limit
        )
        .fetch_all(&state.db)
        .await?;

        results["users"] = json!(users);
    }

    Ok(Json(json!({
        "query": query.q,
        "results": results
    })))
}
