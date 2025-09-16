use redis::aio::MultiplexedConnection;
use solana_client::rpc_client::RpcClient;
use sqlx::PgPool;
use std::sync::Arc;

pub mod health;
pub mod nfts;
pub mod upload;
pub mod users;

use crate::config::Config;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub redis: MultiplexedConnection,
    pub solana_client: Arc<RpcClient>,
    pub config: Config,
}
