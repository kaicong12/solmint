use axum::{
    extract::DefaultBodyLimit,
    http::{header::CONTENT_TYPE, HeaderValue, Method},
    routing::{get, post},
    Router,
};
use std::net::SocketAddr;
use tower::ServiceBuilder;
use tower_http::cors::CorsLayer;

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

    // Start websocket indexer in background
    let indexer_db = db.pool().clone();
    let indexer_config = config.clone();
    tokio::spawn(async move {
        if let Err(e) =
            services::websocket_indexer::start_websocket_indexer(indexer_db, indexer_config).await
        {
            println!("Websocket indexer failed: {:?}", e);
        }
    });

    // Build the application router
    let app = Router::new()
        .route("/health", get(handlers::health::health_check))
        .route("/api/v1/nfts", get(handlers::nfts::list_nfts))
        .route("/api/v1/nfts/{mint}", get(handlers::nfts::get_nft))
        .route("/api/nft/mint", post(handlers::nfts::mint_nft))
        .route(
            "/api/nft/send-transaction",
            post(handlers::nfts::send_transaction),
        )
        .route(
            "/api/upload/presigned",
            post(handlers::upload::generate_presigned_url),
        )
        .route(
            "/api/upload/metadata",
            post(handlers::upload::upload_metadata),
        )
        .route("/api/v1/users/{wallet}", get(handlers::users::get_user))
        .route(
            "/api/v1/users/{wallet}",
            post(handlers::users::create_or_update_user),
        )
        .route(
            "/api/v1/users/{wallet}/favorites",
            get(handlers::users::get_user_favorites),
        )
        .route(
            "/api/v1/users/{wallet}/favorites",
            post(handlers::users::add_favorite),
        )
        .route(
            "/api/v1/users/{wallet}/favorites/{mint}",
            axum::routing::delete(handlers::users::remove_favorite),
        )
        .layer(
            ServiceBuilder::new()
                .layer(cors)
                .layer(DefaultBodyLimit::max(10 * 1024 * 1024)), // 10MB limit
        )
        .with_state(app_state);

    // Start the server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    println!("Server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
