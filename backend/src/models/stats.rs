use chrono::{DateTime, Utc, NaiveDate};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct MarketplaceStats {
    pub id: Uuid,
    pub date: NaiveDate,
    pub total_volume: i64,
    pub total_sales: i32,
    pub unique_buyers: i32,
    pub unique_sellers: i32,
    pub average_price: i64,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GlobalStats {
    pub total_volume: i64,
    pub total_sales: i64,
    pub total_listings: i64,
    pub total_nfts: i64,
    pub total_collections: i64,
    pub total_users: i64,
    pub average_price: Option<i64>,
    pub floor_price: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DailyStats {
    pub date: NaiveDate,
    pub volume: i64,
    pub sales: i32,
    pub unique_buyers: i32,
    pub unique_sellers: i32,
    pub average_price: i64,
}

impl MarketplaceStats {
    pub async fn create_or_update_daily_stats(
        pool: &PgPool,
        date: NaiveDate,
    ) -> Result<Self, crate::error::AppError> {
        let stats = sqlx::query_as!(
            MarketplaceStats,
            r#"
            INSERT INTO marketplace_stats (
                date, total_volume, total_sales, unique_buyers, unique_sellers, average_price
            )
            SELECT 
                $1::date,
                COALESCE(SUM(price), 0) as total_volume,
                COUNT(*)::int as total_sales,
                COUNT(DISTINCT buyer_address)::int as unique_buyers,
                COUNT(DISTINCT seller_address)::int as unique_sellers,
                COALESCE(AVG(price), 0)::bigint as average_price
            FROM sales 
            WHERE DATE(block_time) = $1::date
            ON CONFLICT (date) DO UPDATE SET
                total_volume = EXCLUDED.total_volume,
                total_sales = EXCLUDED.total_sales,
                unique_buyers = EXCLUDED.unique_buyers,
                unique_sellers = EXCLUDED.unique_sellers,
                average_price = EXCLUDED.average_price
            RETURNING *
            "#,
            date
        )
        .fetch_one(pool)
        .await?;

        Ok(stats)
    }

    pub async fn get_global_stats(pool: &PgPool) -> Result<GlobalStats, crate::error::AppError> {
        let stats = sqlx::query_as!(
            GlobalStats,
            r#"
            SELECT 
                (SELECT COALESCE(SUM(price), 0) FROM sales) as total_volume,
                (SELECT COUNT(id) FROM sales) as total_sales,
                (SELECT COUNT(DISTINCT id) FROM listings WHERE status = 'active') as total_listings,
                (SELECT COUNT(DISTINCT id) FROM nfts) as total_nfts,
                (SELECT COUNT(DISTINCT id) FROM collections) as total_collections,
                (SELECT COUNT(DISTINCT id) FROM users) as total_users,
                (SELECT AVG(price)::bigint FROM sales) as average_price,
                (SELECT MIN(price) FROM listings WHERE status = 'active') as floor_price
            FROM (SELECT 1) dummy
            "#
        )
        .fetch_one(pool)
        .await?;

        Ok(stats)
    }

    pub async fn get_daily_stats(
        pool: &PgPool,
        days: i32,
    ) -> Result<Vec<DailyStats>, crate::error::AppError> {
        let stats = sqlx::query_as!(
            DailyStats,
            r#"
            SELECT 
                date,
                total_volume as volume,
                total_sales as sales,
                unique_buyers,
                unique_sellers,
                average_price
            FROM marketplace_stats
            WHERE date >= CURRENT_DATE - ($1)::interval
            ORDER BY date DESC
            "#,
            &format!("{} days", days)
        )
        .fetch_all(pool)
        .await?;

        Ok(stats)
    }

    pub async fn get_collection_stats(
        pool: &PgPool,
        collection_id: Uuid,
        days: Option<i32>,
    ) -> Result<GlobalStats, crate::error::AppError> {
        let days = days.unwrap_or(30);
        
        let stats = sqlx::query_as!(
            GlobalStats,
            r#"
            SELECT 
                COALESCE(SUM(s.price), 0) as total_volume,
                COUNT(s.id) as total_sales,
                COUNT(DISTINCT l.id) as total_listings,
                COUNT(DISTINCT n.id) as total_nfts,
                1 as total_collections,
                COUNT(DISTINCT n.current_owner) as total_users,
                AVG(s.price)::bigint as average_price,
                MIN(l.price) as floor_price
            FROM nfts n
            LEFT JOIN sales s ON n.mint_address = s.nft_mint 
                AND s.block_time >= CURRENT_DATE - ($2)::interval
            LEFT JOIN listings l ON n.mint_address = l.nft_mint AND l.status = 'active'
            WHERE n.collection_id = $1
            "#,
            collection_id,
            &format!("{} days", days)
        )
        .fetch_one(pool)
        .await?;

        Ok(stats)
    }
}
