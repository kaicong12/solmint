use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Listing {
    pub id: Uuid,
    pub listing_address: String,
    pub nft_mint: String,
    pub seller_address: String,
    pub price: i64,
    pub marketplace_address: String,
    pub status: String,
    pub transaction_signature: Option<String>,
    pub block_time: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateListingRequest {
    pub listing_address: String,
    pub nft_mint: String,
    pub seller_address: String,
    pub price: i64,
    pub marketplace_address: String,
    pub transaction_signature: Option<String>,
    pub block_time: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateListingRequest {
    pub price: Option<i64>,
    pub status: Option<String>,
    pub transaction_signature: Option<String>,
    pub block_time: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ListingQuery {
    pub seller_address: Option<String>,
    pub nft_mint: Option<String>,
    pub marketplace_address: Option<String>,
    pub status: Option<String>,
    pub min_price: Option<i64>,
    pub max_price: Option<i64>,
    pub sort_by: Option<String>,    // "price", "created_at"
    pub sort_order: Option<String>, // "asc", "desc"
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ListingWithNft {
    #[serde(flatten)]
    pub listing: Listing,
    pub nft_name: String,
    pub nft_image_url: Option<String>,
    pub nft_description: Option<String>,
    pub collection_name: Option<String>,
}

impl Listing {
    pub async fn create(pool: &PgPool, req: CreateListingRequest) -> Result<Self, crate::error::AppError> {
        let listing = sqlx::query_as!(
            Listing,
            r#"
            INSERT INTO listings (
                listing_address, nft_mint, seller_address, price, 
                marketplace_address, transaction_signature, block_time
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            "#,
            req.listing_address,
            req.nft_mint,
            req.seller_address,
            req.price,
            req.marketplace_address,
            req.transaction_signature,
            req.block_time
        )
        .fetch_one(pool)
        .await?;

        Ok(listing)
    }

    pub async fn find_by_address(pool: &PgPool, listing_address: &str) -> Result<Option<Self>, crate::error::AppError> {
        let listing = sqlx::query_as!(
            Listing,
            "SELECT * FROM listings WHERE listing_address = $1",
            listing_address
        )
        .fetch_optional(pool)
        .await?;

        Ok(listing)
    }

    pub async fn find_by_nft_and_seller(
        pool: &PgPool,
        nft_mint: &str,
        seller_address: &str,
    ) -> Result<Option<Self>, crate::error::AppError> {
        let listing = sqlx::query_as!(
            Listing,
            "SELECT * FROM listings WHERE nft_mint = $1 AND seller_address = $2 AND status = 'active'",
            nft_mint,
            seller_address
        )
        .fetch_optional(pool)
        .await?;

        Ok(listing)
    }

    pub async fn update(
        pool: &PgPool,
        listing_address: &str,
        req: UpdateListingRequest,
    ) -> Result<Self, crate::error::AppError> {
        let listing = sqlx::query_as!(
            Listing,
            r#"
            UPDATE listings SET
                price = COALESCE($2, price),
                status = COALESCE($3, status),
                transaction_signature = COALESCE($4, transaction_signature),
                block_time = COALESCE($5, block_time),
                updated_at = NOW()
            WHERE listing_address = $1
            RETURNING *
            "#,
            listing_address,
            req.price,
            req.status,
            req.transaction_signature,
            req.block_time
        )
        .fetch_one(pool)
        .await?;

        Ok(listing)
    }

    pub async fn list(pool: &PgPool, query: ListingQuery) -> Result<Vec<Self>, crate::error::AppError> {
        let limit = query.limit.unwrap_or(20).min(100);
        let offset = query.page.unwrap_or(0) * limit;
        
        let sort_column = match query.sort_by.as_deref() {
            Some("price") => "price",
            Some("created_at") => "created_at",
            _ => "created_at",
        };
        
        let sort_order = match query.sort_order.as_deref() {
            Some("asc") => "ASC",
            _ => "DESC",
        };

        let mut query_builder = sqlx::QueryBuilder::new("SELECT * FROM listings WHERE 1=1");

        if let Some(seller) = query.seller_address {
            query_builder.push(" AND seller_address = ");
            query_builder.push_bind(seller);
        }

        if let Some(nft_mint) = query.nft_mint {
            query_builder.push(" AND nft_mint = ");
            query_builder.push_bind(nft_mint);
        }

        if let Some(marketplace) = query.marketplace_address {
            query_builder.push(" AND marketplace_address = ");
            query_builder.push_bind(marketplace);
        }

        if let Some(status) = query.status {
            query_builder.push(" AND status = ");
            query_builder.push_bind(status);
        } else {
            // Default to active listings only
            query_builder.push(" AND status = 'active'");
        }

        if let Some(min_price) = query.min_price {
            query_builder.push(" AND price >= ");
            query_builder.push_bind(min_price);
        }

        if let Some(max_price) = query.max_price {
            query_builder.push(" AND price <= ");
            query_builder.push_bind(max_price);
        }

        query_builder.push(" ORDER BY ");
        query_builder.push(sort_column);
        query_builder.push(" ");
        query_builder.push(sort_order);
        query_builder.push(" LIMIT ");
        query_builder.push_bind(limit);
        query_builder.push(" OFFSET ");
        query_builder.push_bind(offset);

        let listings = query_builder
            .build_query_as::<Listing>()
            .fetch_all(pool)
            .await?;

        Ok(listings)
    }

    pub async fn list_with_nft_info(pool: &PgPool, query: ListingQuery) -> Result<Vec<ListingWithNft>, crate::error::AppError> {
        let limit = query.limit.unwrap_or(20).min(100);
        let offset = query.page.unwrap_or(0) * limit;
        
        let sort_column = match query.sort_by.as_deref() {
            Some("price") => "l.price",
            Some("created_at") => "l.created_at",
            _ => "l.created_at",
        };
        
        let sort_order = match query.sort_order.as_deref() {
            Some("asc") => "ASC",
            _ => "DESC",
        };

        let mut query_builder = sqlx::QueryBuilder::new(
            r#"
            SELECT 
                l.*,
                n.name as nft_name,
                n.image_url as nft_image_url,
                n.description as nft_description,
                c.name as collection_name
            FROM listings l
            JOIN nfts n ON l.nft_mint = n.mint_address
            LEFT JOIN collections c ON n.collection_id = c.id
            WHERE 1=1
            "#
        );

        if let Some(seller) = query.seller_address {
            query_builder.push(" AND l.seller_address = ");
            query_builder.push_bind(seller);
        }

        if let Some(nft_mint) = query.nft_mint {
            query_builder.push(" AND l.nft_mint = ");
            query_builder.push_bind(nft_mint);
        }

        if let Some(marketplace) = query.marketplace_address {
            query_builder.push(" AND l.marketplace_address = ");
            query_builder.push_bind(marketplace);
        }

        if let Some(status) = query.status {
            query_builder.push(" AND l.status = ");
            query_builder.push_bind(status);
        } else {
            query_builder.push(" AND l.status = 'active'");
        }

        if let Some(min_price) = query.min_price {
            query_builder.push(" AND l.price >= ");
            query_builder.push_bind(min_price);
        }

        if let Some(max_price) = query.max_price {
            query_builder.push(" AND l.price <= ");
            query_builder.push_bind(max_price);
        }

        query_builder.push(" ORDER BY ");
        query_builder.push(sort_column);
        query_builder.push(" ");
        query_builder.push(sort_order);
        query_builder.push(" LIMIT ");
        query_builder.push_bind(limit);
        query_builder.push(" OFFSET ");
        query_builder.push_bind(offset);

        let listings = query_builder
            .build_query_as::<ListingWithNft>()
            .fetch_all(pool)
            .await?;

        Ok(listings)
    }

    pub async fn count(pool: &PgPool, query: &ListingQuery) -> Result<i64, crate::error::AppError> {
        let mut query_builder = sqlx::QueryBuilder::new("SELECT COUNT(*) FROM listings WHERE 1=1");

        if let Some(seller) = &query.seller_address {
            query_builder.push(" AND seller_address = ");
            query_builder.push_bind(seller);
        }

        if let Some(nft_mint) = &query.nft_mint {
            query_builder.push(" AND nft_mint = ");
            query_builder.push_bind(nft_mint);
        }

        if let Some(marketplace) = &query.marketplace_address {
            query_builder.push(" AND marketplace_address = ");
            query_builder.push_bind(marketplace);
        }

        if let Some(status) = &query.status {
            query_builder.push(" AND status = ");
            query_builder.push_bind(status);
        } else {
            query_builder.push(" AND status = 'active'");
        }

        if let Some(min_price) = query.min_price {
            query_builder.push(" AND price >= ");
            query_builder.push_bind(min_price);
        }

        if let Some(max_price) = query.max_price {
            query_builder.push(" AND price <= ");
            query_builder.push_bind(max_price);
        }

        let count: (i64,) = query_builder
            .build_query_as()
            .fetch_one(pool)
            .await?;

        Ok(count.0)
    }

    pub async fn get_floor_price_by_collection(
        pool: &PgPool,
        collection_id: Uuid,
    ) -> Result<Option<i64>, crate::error::AppError> {
        let result = sqlx::query!(
            r#"
            SELECT MIN(l.price) as floor_price
            FROM listings l
            JOIN nfts n ON l.nft_mint = n.mint_address
            WHERE n.collection_id = $1 AND l.status = 'active'
            "#,
            collection_id
        )
        .fetch_one(pool)
        .await?;

        Ok(result.floor_price)
    }
}
