use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Nft {
    pub id: Uuid,
    pub mint_address: String,
    pub collection_id: Option<Uuid>,
    pub name: String,
    pub description: Option<String>,
    pub image_url: Option<String>,
    pub animation_url: Option<String>,
    pub external_url: Option<String>,
    pub attributes: Option<serde_json::Value>,
    pub creator_address: String,
    pub current_owner: String,
    pub is_compressed: bool,
    pub rarity_rank: Option<i32>,
    pub rarity_score: Option<rust_decimal::Decimal>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NftAttribute {
    pub trait_type: String,
    pub value: serde_json::Value,
    pub display_type: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateNftRequest {
    pub mint_address: String,
    pub collection_id: Option<Uuid>,
    pub name: String,
    pub description: Option<String>,
    pub image_url: Option<String>,
    pub animation_url: Option<String>,
    pub external_url: Option<String>,
    pub attributes: Option<Vec<NftAttribute>>,
    pub creator_address: String,
    pub current_owner: String,
    pub is_compressed: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateNftRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub image_url: Option<String>,
    pub animation_url: Option<String>,
    pub external_url: Option<String>,
    pub attributes: Option<Vec<NftAttribute>>,
    pub current_owner: Option<String>,
    pub rarity_rank: Option<i32>,
    pub rarity_score: Option<rust_decimal::Decimal>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NftListQuery {
    pub collection_id: Option<Uuid>,
    pub owner: Option<String>,
    pub creator: Option<String>,
    pub min_price: Option<i64>,
    pub max_price: Option<i64>,
    pub rarity_rank_min: Option<i32>,
    pub rarity_rank_max: Option<i32>,
    pub attributes: Option<String>, // JSON string of attribute filters
    pub sort_by: Option<String>,    // "price", "rarity", "created_at"
    pub sort_order: Option<String>, // "asc", "desc"
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

impl Nft {
    pub async fn create(
        pool: &PgPool,
        req: CreateNftRequest,
    ) -> Result<Self, crate::error::AppError> {
        let attributes_json = req
            .attributes
            .map(|attrs| serde_json::to_value(attrs))
            .transpose()?;

        let nft = sqlx::query_as!(
            Nft,
            r#"
            INSERT INTO nfts (
                mint_address, collection_id, name, description, image_url, 
                animation_url, external_url, attributes, creator_address, 
                current_owner, is_compressed
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
            "#,
            req.mint_address,
            req.collection_id,
            req.name,
            req.description,
            req.image_url,
            req.animation_url,
            req.external_url,
            attributes_json,
            req.creator_address,
            req.current_owner,
            req.is_compressed.unwrap_or(false)
        )
        .fetch_one(pool)
        .await?;

        Ok(nft)
    }

    pub async fn find_by_mint(
        pool: &PgPool,
        mint_address: &str,
    ) -> Result<Option<Self>, crate::error::AppError> {
        let nft = sqlx::query_as!(
            Nft,
            "SELECT * FROM nfts WHERE mint_address = $1",
            mint_address
        )
        .fetch_optional(pool)
        .await?;

        Ok(nft)
    }

    pub async fn update(
        pool: &PgPool,
        mint_address: &str,
        req: UpdateNftRequest,
    ) -> Result<Self, crate::error::AppError> {
        let attributes_json = req
            .attributes
            .map(|attrs| serde_json::to_value(attrs))
            .transpose()?;

        let nft = sqlx::query_as!(
            Nft,
            r#"
            UPDATE nfts SET
                name = COALESCE($2, name),
                description = COALESCE($3, description),
                image_url = COALESCE($4, image_url),
                animation_url = COALESCE($5, animation_url),
                external_url = COALESCE($6, external_url),
                attributes = COALESCE($7, attributes),
                current_owner = COALESCE($8, current_owner),
                rarity_rank = COALESCE($9, rarity_rank),
                rarity_score = COALESCE($10, rarity_score),
                updated_at = NOW()
            WHERE mint_address = $1
            RETURNING *
            "#,
            mint_address,
            req.name,
            req.description,
            req.image_url,
            req.animation_url,
            req.external_url,
            attributes_json,
            req.current_owner,
            req.rarity_rank,
            req.rarity_score
        )
        .fetch_one(pool)
        .await?;

        Ok(nft)
    }

    pub async fn list(
        pool: &PgPool,
        query: NftListQuery,
    ) -> Result<Vec<Self>, crate::error::AppError> {
        let limit = query.limit.unwrap_or(20).min(100);
        let offset = query.page.unwrap_or(0) * limit;

        let sort_column = match query.sort_by.as_deref() {
            Some("price") => "l.price",
            Some("rarity") => "n.rarity_rank",
            Some("created_at") => "n.created_at",
            _ => "n.created_at",
        };

        let sort_order = match query.sort_order.as_deref() {
            Some("asc") => "ASC",
            _ => "DESC",
        };

        let mut query_builder = sqlx::QueryBuilder::new(
            r#"
            SELECT DISTINCT n.* FROM nfts n
            LEFT JOIN listings l ON n.mint_address = l.nft_mint AND l.status = 'active'
            WHERE 1=1
            "#,
        );

        if let Some(collection_id) = query.collection_id {
            query_builder.push(" AND n.collection_id = ");
            query_builder.push_bind(collection_id);
        }

        if let Some(owner) = query.owner {
            query_builder.push(" AND n.current_owner = ");
            query_builder.push_bind(owner);
        }

        if let Some(creator) = query.creator {
            query_builder.push(" AND n.creator_address = ");
            query_builder.push_bind(creator);
        }

        if let Some(min_price) = query.min_price {
            query_builder.push(" AND l.price >= ");
            query_builder.push_bind(min_price);
        }

        if let Some(max_price) = query.max_price {
            query_builder.push(" AND l.price <= ");
            query_builder.push_bind(max_price);
        }

        if let Some(min_rank) = query.rarity_rank_min {
            query_builder.push(" AND n.rarity_rank >= ");
            query_builder.push_bind(min_rank);
        }

        if let Some(max_rank) = query.rarity_rank_max {
            query_builder.push(" AND n.rarity_rank <= ");
            query_builder.push_bind(max_rank);
        }

        query_builder.push(" ORDER BY ");
        query_builder.push(sort_column);
        query_builder.push(" ");
        query_builder.push(sort_order);
        query_builder.push(" LIMIT ");
        query_builder.push_bind(limit);
        query_builder.push(" OFFSET ");
        query_builder.push_bind(offset);

        let nfts = query_builder
            .build_query_as::<Nft>()
            .fetch_all(pool)
            .await?;

        Ok(nfts)
    }

    pub async fn count(pool: &PgPool, query: &NftListQuery) -> Result<i64, crate::error::AppError> {
        let mut query_builder = sqlx::QueryBuilder::new(
            r#"
            SELECT COUNT(DISTINCT n.id) FROM nfts n
            LEFT JOIN listings l ON n.mint_address = l.nft_mint AND l.status = 'active'
            WHERE 1=1
            "#,
        );

        if let Some(collection_id) = query.collection_id {
            query_builder.push(" AND n.collection_id = ");
            query_builder.push_bind(collection_id);
        }

        if let Some(owner) = &query.owner {
            query_builder.push(" AND n.current_owner = ");
            query_builder.push_bind(owner);
        }

        if let Some(creator) = &query.creator {
            query_builder.push(" AND n.creator_address = ");
            query_builder.push_bind(creator);
        }

        if let Some(min_price) = query.min_price {
            query_builder.push(" AND l.price >= ");
            query_builder.push_bind(min_price);
        }

        if let Some(max_price) = query.max_price {
            query_builder.push(" AND l.price <= ");
            query_builder.push_bind(max_price);
        }

        let count: (i64,) = query_builder.build_query_as().fetch_one(pool).await?;

        Ok(count.0)
    }
}
