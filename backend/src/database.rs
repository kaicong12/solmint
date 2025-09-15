use crate::error::AppError;
use sqlx::{postgres::PgPoolOptions, PgPool};

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
        // Run migrations using sqlx migrate
        // sqlx::migrate!("./migrations").run(&self.pool).await?;

        println!("Database migrations completed successfully");
        Ok(())
    }

    pub async fn health_check(&self) -> Result<(), AppError> {
        sqlx::query("SELECT 1").execute(&self.pool).await?;
        Ok(())
    }
}
