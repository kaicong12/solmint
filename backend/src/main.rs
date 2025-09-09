use axum::{
    extract::DefaultBodyLimit,
    http::{header::CONTENT_TYPE, HeaderValue, Method},
    routing::{get, post},
    Router,
};
use std::net::SocketAddr;
use tower::ServiceBuilder;
use tower_http::{
    cors::CorsLayer,
    trace::{DefaultMakeSpan, TraceLayer},
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod database;
mod error;
mod handlers;
mod models;
mod services;

use config::Config;
use database::Database;
use error::AppError;

#[tokio::main]
async fn main() -> Result<(), AppError> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "solmint_backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    let config = Config::from_env()?;
    
    // Initialize database
    let db = Database::new(&config.database_url).await?;
    
    // Run migrations
    db.migrate().await?;
    
    // Initialize Redis connection
    let redis_client = redis::Client::open(config.redis_url.clone())?;
    let redis_conn = redis_client.get_multiplexed_async_connection().await?;
    
    // Initialize Solana client
    let solana_client = solana_client::rpc_client::RpcClient::new(config.solana_rpc_url.clone());
    
    // Create application state
    let app_state = handlers::AppState {
        db: db.pool().clone(),
        redis: redis_conn,
        solana_client: std::sync::Arc::new(solana_client),
        config: config.clone(),
    };

    // Build CORS layer
    let cors = CorsLayer::new()
        .allow_origin("http://localhost:3000".parse::<HeaderValue>().unwrap())
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers([CONTENT_TYPE]);

    // Build the application router
    let app = Router::new()
        .route("/health", get(handlers::health::health_check))
        .route("/api/v1/nfts", get(handlers::nfts::list_nfts))
        .route("/api/v1/nfts/:mint", get(handlers::nfts::get_nft))
        .route("/api/v1/nfts/:mint/activities", get(handlers::nfts::get_nft_activities))
        .route("/api/v1/collections", get(handlers::collections::list_collections))
        .route("/api/v1/collections/:id", get(handlers::collections::get_collection))
        .route("/api/v1/collections/:id/nfts", get(handlers::collections::get_collection_nfts))
        .route("/api/v1/listings", get(handlers::listings::list_listings))
        .route("/api/v1/listings/:id", get(handlers::listings::get_listing))
        .route("/api/v1/sales", get(handlers::sales::list_sales))
        .route("/api/v1/stats", get(handlers::stats::get_marketplace_stats))
        .route("/api/v1/stats/daily", get(handlers::stats::get_daily_stats))
        .route("/api/v1/users/:wallet", get(handlers::users::get_user))
        .route("/api/v1/users/:wallet", post(handlers::users::create_or_update_user))
        .route("/api/v1/users/:wallet/favorites", get(handlers::users::get_user_favorites))
        .route("/api/v1/users/:wallet/favorites", post(handlers::users::add_favorite))
        .route("/api/v1/users/:wallet/favorites/:mint", axum::routing::delete(handlers::users::remove_favorite))
        .route("/api/v1/search", get(handlers::search::search))
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http()
                    .make_span_with(DefaultMakeSpan::default().include_headers(true)))
                .layer(cors)
                .layer(DefaultBodyLimit::max(10 * 1024 * 1024)) // 10MB limit
        )
        .with_state(app_state);

    // Start the indexer service in the background
    let indexer_db = db.pool().clone();
    let indexer_solana_client = solana_client::rpc_client::RpcClient::new(config.solana_rpc_url.clone());
    let indexer_config = config.clone();
    
    tokio::spawn(async move {
        if let Err(e) = services::indexer::start_indexer(
            indexer_db,
            std::sync::Arc::new(indexer_solana_client),
            indexer_config,
        ).await {
            tracing::error!("Indexer error: {:?}", e);
        }
    });

    // Start the server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!("Server listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
