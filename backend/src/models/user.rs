use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub wallet_address: String,
    pub username: Option<String>,
    pub email: Option<String>,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
    pub twitter_handle: Option<String>,
    pub discord_handle: Option<String>,
    pub verified: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateUserRequest {
    pub wallet_address: String,
    pub username: Option<String>,
    pub email: Option<String>,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
    pub twitter_handle: Option<String>,
    pub discord_handle: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateUserRequest {
    pub username: Option<String>,
    pub email: Option<String>,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
    pub twitter_handle: Option<String>,
    pub discord_handle: Option<String>,
}

impl User {
    pub async fn create(pool: &PgPool, req: CreateUserRequest) -> Result<Self, crate::error::AppError> {
        let user = sqlx::query_as!(
            User,
            r#"
            INSERT INTO users (
                wallet_address, username, email, bio, avatar_url, 
                twitter_handle, discord_handle
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            "#,
            req.wallet_address,
            req.username,
            req.email,
            req.bio,
            req.avatar_url,
            req.twitter_handle,
            req.discord_handle
        )
        .fetch_one(pool)
        .await?;

        Ok(user)
    }

    pub async fn find_by_wallet(pool: &PgPool, wallet_address: &str) -> Result<Option<Self>, crate::error::AppError> {
        let user = sqlx::query_as!(
            User,
            "SELECT * FROM users WHERE wallet_address = $1",
            wallet_address
        )
        .fetch_optional(pool)
        .await?;

        Ok(user)
    }

    pub async fn update(
        pool: &PgPool,
        wallet_address: &str,
        req: UpdateUserRequest,
    ) -> Result<Self, crate::error::AppError> {
        let user = sqlx::query_as!(
            User,
            r#"
            UPDATE users SET
                username = COALESCE($2, username),
                email = COALESCE($3, email),
                bio = COALESCE($4, bio),
                avatar_url = COALESCE($5, avatar_url),
                twitter_handle = COALESCE($6, twitter_handle),
                discord_handle = COALESCE($7, discord_handle),
                updated_at = NOW()
            WHERE wallet_address = $1
            RETURNING *
            "#,
            wallet_address,
            req.username,
            req.email,
            req.bio,
            req.avatar_url,
            req.twitter_handle,
            req.discord_handle
        )
        .fetch_one(pool)
        .await?;

        Ok(user)
    }
}
