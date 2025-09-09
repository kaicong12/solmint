use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Activity {
    pub id: Uuid,
    pub activity_type: String,
    pub nft_mint: String,
    pub from_address: Option<String>,
    pub to_address: Option<String>,
    pub price: Option<i64>,
    pub transaction_signature: Option<String>,
    pub block_time: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateActivityRequest {
    pub activity_type: String,
    pub nft_mint: String,
    pub from_address: Option<String>,
    pub to_address: Option<String>,
    pub price: Option<i64>,
    pub transaction_signature: Option<String>,
    pub block_time: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ActivityQuery {
    pub nft_mint: Option<String>,
    pub activity_type: Option<String>,
    pub from_address: Option<String>,
    pub to_address: Option<String>,
    pub from_date: Option<DateTime<Utc>>,
    pub to_date: Option<DateTime<Utc>>,
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

impl Activity {
    pub async fn create(pool: &PgPool, req: CreateActivityRequest) -> Result<Self, crate::error::AppError> {
        let activity = sqlx::query_as!(
            Activity,
            r#"
            INSERT INTO activities (
                activity_type, nft_mint, from_address, to_address, 
                price, transaction_signature, block_time
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            "#,
            req.activity_type,
            req.nft_mint,
            req.from_address,
            req.to_address,
            req.price,
            req.transaction_signature,
            req.block_time
        )
        .fetch_one(pool)
        .await?;

        Ok(activity)
    }

    pub async fn list(pool: &PgPool, query: ActivityQuery) -> Result<Vec<Self>, crate::error::AppError> {
        let limit = query.limit.unwrap_or(20).min(100);
        let offset = query.page.unwrap_or(0) * limit;

        let mut query_builder = sqlx::QueryBuilder::new("SELECT * FROM activities WHERE 1=1");

        if let Some(nft_mint) = query.nft_mint {
            query_builder.push(" AND nft_mint = ");
            query_builder.push_bind(nft_mint);
        }

        if let Some(activity_type) = query.activity_type {
            query_builder.push(" AND activity_type = ");
            query_builder.push_bind(activity_type);
        }

        if let Some(from_address) = query.from_address {
            query_builder.push(" AND from_address = ");
            query_builder.push_bind(from_address);
        }

        if let Some(to_address) = query.to_address {
            query_builder.push(" AND to_address = ");
            query_builder.push_bind(to_address);
        }

        if let Some(from_date) = query.from_date {
            query_builder.push(" AND block_time >= ");
            query_builder.push_bind(from_date);
        }

        if let Some(to_date) = query.to_date {
            query_builder.push(" AND block_time <= ");
            query_builder.push_bind(to_date);
        }

        query_builder.push(" ORDER BY block_time DESC");
        query_builder.push(" LIMIT ");
        query_builder.push_bind(limit);
        query_builder.push(" OFFSET ");
        query_builder.push_bind(offset);

        let activities = query_builder
            .build_query_as::<Activity>()
            .fetch_all(pool)
            .await?;

        Ok(activities)
    }
}
