use sqlx::{postgres::PgPoolOptions, PgPool};
use crate::error::AppError;

#[derive(Clone)]
pub struct Database {
    pool: PgPool,
}

impl Database {
    pub async fn new(database_url: &str) -> Result<Self, AppError> {
        let pool = PgPoolOptions::new()
            .max_connections(20)
            .connect(database_url)
            .await?;

        Ok(Database { pool })
    }

    pub fn pool(&self) -> &PgPool {
        &self.pool
    }

    pub async fn migrate(&self) -> Result<(), AppError> {
        // Read and execute migration file
        let migration_sql = include_str!("../migrations/001_initial.sql");
        
        sqlx::raw_sql(migration_sql)
            .execute(&self.pool)
            .await?;

        tracing::info!("Database migrations completed successfully");
        Ok(())
    }

    pub async fn health_check(&self) -> Result<(), AppError> {
        sqlx::query("SELECT 1")
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}
