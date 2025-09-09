use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Collection {
    pub id: Uuid,
    pub name: String,
    pub symbol: String,
    pub description: Option<String>,
    pub image_url: Option<String>,
    pub banner_url: Option<String>,
    pub creator_address: String,
    pub verified: bool,
    pub floor_price: Option<i64>,
    pub total_volume: i64,
    pub total_supply: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCollectionRequest {
    pub name: String,
    pub symbol: String,
    pub description: Option<String>,
    pub image_url: Option<String>,
    pub banner_url: Option<String>,
    pub creator_address: String,
    pub total_supply: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateCollectionRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub image_url: Option<String>,
    pub banner_url: Option<String>,
    pub verified: Option<bool>,
    pub floor_price: Option<i64>,
    pub total_volume: Option<i64>,
    pub total_supply: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CollectionQuery {
    pub creator_address: Option<String>,
    pub verified: Option<bool>,
    pub min_floor_price: Option<i64>,
    pub max_floor_price: Option<i64>,
    pub sort_by: Option<String>,    // "floor_price", "total_volume", "created_at"
    pub sort_order: Option<String>, // "asc", "desc"
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CollectionStats {
    pub collection_id: Uuid,
    pub floor_price: Option<i64>,
    pub total_volume: i64,
    pub total_sales: i64,
    pub unique_owners: i64,
    pub listed_count: i64,
    pub average_price: Option<i64>,
}

impl Collection {
    pub async fn create(pool: &PgPool, req: CreateCollectionRequest) -> Result<Self, crate::error::AppError> {
        let collection = sqlx::query_as!(
            Collection,
            r#"
            INSERT INTO collections (
                name, symbol, description, image_url, banner_url, 
                creator_address, total_supply
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            "#,
            req.name,
            req.symbol,
            req.description,
            req.image_url,
            req.banner_url,
            req.creator_address,
            req.total_supply.unwrap_or(0)
        )
        .fetch_one(pool)
        .await?;

        Ok(collection)
    }

    pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Self>, crate::error::AppError> {
        let collection = sqlx::query_as!(
            Collection,
            "SELECT * FROM collections WHERE id = $1",
            id
        )
        .fetch_optional(pool)
        .await?;

        Ok(collection)
    }

    pub async fn find_by_name(pool: &PgPool, name: &str) -> Result<Option<Self>, crate::error::AppError> {
        let collection = sqlx::query_as!(
            Collection,
            "SELECT * FROM collections WHERE name = $1",
            name
        )
        .fetch_optional(pool)
        .await?;

        Ok(collection)
    }

    pub async fn update(
        pool: &PgPool,
        id: Uuid,
        req: UpdateCollectionRequest,
    ) -> Result<Self, crate::error::AppError> {
        let collection = sqlx::query_as!(
            Collection,
            r#"
            UPDATE collections SET
                name = COALESCE($2, name),
                description = COALESCE($3, description),
                image_url = COALESCE($4, image_url),
                banner_url = COALESCE($5, banner_url),
                verified = COALESCE($6, verified),
                floor_price = COALESCE($7, floor_price),
                total_volume = COALESCE($8, total_volume),
                total_supply = COALESCE($9, total_supply),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
            "#,
            id,
            req.name,
            req.description,
            req.image_url,
            req.banner_url,
            req.verified,
            req.floor_price,
            req.total_volume,
            req.total_supply
        )
        .fetch_one(pool)
        .await?;

        Ok(collection)
    }

    pub async fn list(pool: &PgPool, query: CollectionQuery) -> Result<Vec<Self>, crate::error::AppError> {
        let limit = query.limit.unwrap_or(20).min(100);
        let offset = query.page.unwrap_or(0) * limit;
        
        let sort_column = match query.sort_by.as_deref() {
            Some("floor_price") => "floor_price",
            Some("total_volume") => "total_volume",
            Some("created_at") => "created_at",
            _ => "created_at",
        };
        
        let sort_order = match query.sort_order.as_deref() {
            Some("asc") => "ASC",
            _ => "DESC",
        };

        let mut query_builder = sqlx::QueryBuilder::new("SELECT * FROM collections WHERE 1=1");

        if let Some(creator) = query.creator_address {
            query_builder.push(" AND creator_address = ");
            query_builder.push_bind(creator);
        }

        if let Some(verified) = query.verified {
            query_builder.push(" AND verified = ");
            query_builder.push_bind(verified);
        }

        if let Some(min_floor) = query.min_floor_price {
            query_builder.push(" AND floor_price >= ");
            query_builder.push_bind(min_floor);
        }

        if let Some(max_floor) = query.max_floor_price {
            query_builder.push(" AND floor_price <= ");
            query_builder.push_bind(max_floor);
        }

        query_builder.push(" ORDER BY ");
        query_builder.push(sort_column);
        query_builder.push(" ");
        query_builder.push(sort_order);
        query_builder.push(" LIMIT ");
        query_builder.push_bind(limit);
        query_builder.push(" OFFSET ");
        query_builder.push_bind(offset);

        let collections = query_builder
            .build_query_as::<Collection>()
            .fetch_all(pool)
            .await?;

        Ok(collections)
    }

    pub async fn get_stats(pool: &PgPool, collection_id: Uuid) -> Result<CollectionStats, crate::error::AppError> {
        let stats = sqlx::query_as!(
            CollectionStats,
            r#"
            SELECT 
                $1 as collection_id,
                MIN(l.price) as floor_price,
                COALESCE(SUM(s.price), 0) as total_volume,
                COUNT(s.id) as total_sales,
                COUNT(DISTINCT n.current_owner) as unique_owners,
                COUNT(DISTINCT l.id) as listed_count,
                AVG(s.price)::bigint as average_price
            FROM collections c
            LEFT JOIN nfts n ON c.id = n.collection_id
            LEFT JOIN listings l ON n.mint_address = l.nft_mint AND l.status = 'active'
            LEFT JOIN sales s ON n.mint_address = s.nft_mint
            WHERE c.id = $1
            GROUP BY c.id
            "#,
            collection_id
        )
        .fetch_one(pool)
        .await?;

        Ok(stats)
    }

    pub async fn update_floor_price(pool: &PgPool, collection_id: Uuid) -> Result<(), crate::error::AppError> {
        sqlx::query!(
            r#"
            UPDATE collections 
            SET floor_price = (
                SELECT MIN(l.price)
                FROM listings l
                JOIN nfts n ON l.nft_mint = n.mint_address
                WHERE n.collection_id = $1 AND l.status = 'active'
            )
            WHERE id = $1
            "#,
            collection_id
        )
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn update_total_volume(pool: &PgPool, collection_id: Uuid) -> Result<(), crate::error::AppError> {
        sqlx::query!(
            r#"
            UPDATE collections 
            SET total_volume = (
                SELECT COALESCE(SUM(s.price), 0)
                FROM sales s
                JOIN nfts n ON s.nft_mint = n.mint_address
                WHERE n.collection_id = $1
            )
            WHERE id = $1
            "#,
            collection_id
        )
        .execute(pool)
        .await?;

        Ok(())
    }
}
