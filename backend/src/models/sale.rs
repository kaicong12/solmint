use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Sale {
    pub id: Uuid,
    pub nft_mint: String,
    pub seller_address: String,
    pub buyer_address: String,
    pub price: i64,
    pub marketplace_fee: i64,
    pub transaction_signature: String,
    pub block_time: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSaleRequest {
    pub nft_mint: String,
    pub seller_address: String,
    pub buyer_address: String,
    pub price: i64,
    pub marketplace_fee: i64,
    pub transaction_signature: String,
    pub block_time: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SaleQuery {
    pub nft_mint: Option<String>,
    pub seller_address: Option<String>,
    pub buyer_address: Option<String>,
    pub min_price: Option<i64>,
    pub max_price: Option<i64>,
    pub from_date: Option<DateTime<Utc>>,
    pub to_date: Option<DateTime<Utc>>,
    pub sort_by: Option<String>,    // "price", "block_time"
    pub sort_order: Option<String>, // "asc", "desc"
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

impl Sale {
    pub async fn create(pool: &PgPool, req: CreateSaleRequest) -> Result<Self, crate::error::AppError> {
        let sale = sqlx::query_as!(
            Sale,
            r#"
            INSERT INTO sales (
                nft_mint, seller_address, buyer_address, price, 
                marketplace_fee, transaction_signature, block_time
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            "#,
            req.nft_mint,
            req.seller_address,
            req.buyer_address,
            req.price,
            req.marketplace_fee,
            req.transaction_signature,
            req.block_time
        )
        .fetch_one(pool)
        .await?;

        Ok(sale)
    }

    pub async fn find_by_signature(pool: &PgPool, signature: &str) -> Result<Option<Self>, crate::error::AppError> {
        let sale = sqlx::query_as!(
            Sale,
            "SELECT * FROM sales WHERE transaction_signature = $1",
            signature
        )
        .fetch_optional(pool)
        .await?;

        Ok(sale)
    }

    pub async fn list(pool: &PgPool, query: SaleQuery) -> Result<Vec<Self>, crate::error::AppError> {
        let limit = query.limit.unwrap_or(20).min(100);
        let offset = query.page.unwrap_or(0) * limit;
        
        let sort_column = match query.sort_by.as_deref() {
            Some("price") => "price",
            Some("block_time") => "block_time",
            _ => "block_time",
        };
        
        let sort_order = match query.sort_order.as_deref() {
            Some("asc") => "ASC",
            _ => "DESC",
        };

        let mut query_builder = sqlx::QueryBuilder::new("SELECT * FROM sales WHERE 1=1");

        if let Some(nft_mint) = query.nft_mint {
            query_builder.push(" AND nft_mint = ");
            query_builder.push_bind(nft_mint);
        }

        if let Some(seller) = query.seller_address {
            query_builder.push(" AND seller_address = ");
            query_builder.push_bind(seller);
        }

        if let Some(buyer) = query.buyer_address {
            query_builder.push(" AND buyer_address = ");
            query_builder.push_bind(buyer);
        }

        if let Some(min_price) = query.min_price {
            query_builder.push(" AND price >= ");
            query_builder.push_bind(min_price);
        }

        if let Some(max_price) = query.max_price {
            query_builder.push(" AND price <= ");
            query_builder.push_bind(max_price);
        }

        if let Some(from_date) = query.from_date {
            query_builder.push(" AND block_time >= ");
            query_builder.push_bind(from_date);
        }

        if let Some(to_date) = query.to_date {
            query_builder.push(" AND block_time <= ");
            query_builder.push_bind(to_date);
        }

        query_builder.push(" ORDER BY ");
        query_builder.push(sort_column);
        query_builder.push(" ");
        query_builder.push(sort_order);
        query_builder.push(" LIMIT ");
        query_builder.push_bind(limit);
        query_builder.push(" OFFSET ");
        query_builder.push_bind(offset);

        let sales = query_builder
            .build_query_as::<Sale>()
            .fetch_all(pool)
            .await?;

        Ok(sales)
    }
}
