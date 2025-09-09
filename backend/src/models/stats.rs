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
                COALESCE(SUM(s.price), 0) as total_volume,
                COUNT(s.id) as total_sales,
                COUNT(DISTINCT l.id) as total_listings,
                COUNT(DISTINCT n.id) as total_nfts,
                COUNT(DISTINCT c.id) as total_collections,
                COUNT(DISTINCT u.id) as total_users,
                AVG(s.price)::bigint as average_price,
                MIN(l.price) as floor_price
            FROM sales s
            FULL OUTER JOIN listings l ON l.status = 'active'
            FULL OUTER JOIN nfts n ON true
            FULL OUTER JOIN collections c ON true
            FULL OUTER JOIN users u ON true
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
            WHERE date >= CURRENT_DATE - INTERVAL '%d days'
            ORDER BY date DESC
            "#,
            days
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
                AND s.block_time >= CURRENT_DATE - INTERVAL '%d days'
            LEFT JOIN listings l ON n.mint_address = l.nft_mint AND l.status = 'active'
            WHERE n.collection_id = $1
            "#,
            collection_id,
            days
        )
        .fetch_one(pool)
        .await?;

        Ok(stats)
    }
}
