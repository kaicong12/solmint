use axum::{
    extract::{Path, State},
    Json,
};
use serde_json::{json, Value};

use super::AppState;
use crate::{
    error::AppError,
    models::{CreateUserRequest, UpdateUserRequest, User},
};

pub async fn get_user(
    State(state): State<AppState>,
    Path(wallet_address): Path<String>,
) -> Result<Json<Value>, AppError> {
    let user = User::find_by_wallet(&state.db, &wallet_address).await?;

    Ok(Json(json!({
        "user": user
    })))
}

pub async fn create_or_update_user(
    State(state): State<AppState>,
    Path(wallet_address): Path<String>,
    Json(payload): Json<UpdateUserRequest>,
) -> Result<Json<Value>, AppError> {
    let user = match User::find_by_wallet(&state.db, &wallet_address).await? {
        Some(_) => User::update(&state.db, &wallet_address, payload).await?,
        None => {
            let create_req = CreateUserRequest {
                wallet_address: wallet_address.clone(),
                username: payload.username,
                email: payload.email,
                bio: payload.bio,
                avatar_url: payload.avatar_url,
                twitter_handle: payload.twitter_handle,
                discord_handle: payload.discord_handle,
            };
            User::create(&state.db, create_req).await?
        }
    };

    Ok(Json(json!({
        "user": user
    })))
}

pub async fn get_user_favorites(
    State(state): State<AppState>,
    Path(wallet_address): Path<String>,
) -> Result<Json<Value>, AppError> {
    let favorites = sqlx::query!(
        r#"
        SELECT n.* FROM nfts n
        JOIN user_favorites uf ON n.mint_address = uf.nft_mint
        JOIN users u ON uf.user_id = u.id
        WHERE u.wallet_address = $1
        ORDER BY uf.created_at DESC
        "#,
        wallet_address
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(json!({
        "favorites": favorites
    })))
}

pub async fn add_favorite(
    State(state): State<AppState>,
    Path(wallet_address): Path<String>,
    Json(payload): Json<serde_json::Value>,
) -> Result<Json<Value>, AppError> {
    let nft_mint = payload["nft_mint"]
        .as_str()
        .ok_or_else(|| crate::error::bad_request_error("nft_mint is required"))?;

    let user = User::find_by_wallet(&state.db, &wallet_address)
        .await?
        .ok_or_else(|| crate::error::not_found_error("User"))?;

    sqlx::query!(
        "INSERT INTO user_favorites (user_id, nft_mint) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        user.id,
        nft_mint
    )
    .execute(&state.db)
    .await?;

    Ok(Json(json!({
        "success": true
    })))
}

pub async fn remove_favorite(
    State(state): State<AppState>,
    Path((wallet_address, nft_mint)): Path<(String, String)>,
) -> Result<Json<Value>, AppError> {
    let user = User::find_by_wallet(&state.db, &wallet_address)
        .await?
        .ok_or_else(|| crate::error::not_found_error("User"))?;

    sqlx::query!(
        "DELETE FROM user_favorites WHERE user_id = $1 AND nft_mint = $2",
        user.id,
        nft_mint
    )
    .execute(&state.db)
    .await?;

    Ok(Json(json!({
        "success": true
    })))
}
