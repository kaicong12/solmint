use crate::{
    config::Config,
    error::AppError,
    models::{CreateNftRequest, Nft},
};
use serde::{Deserialize, Serialize};
use solana_client::{
    pubsub_client::PubsubClient,
    rpc_config::{RpcTransactionLogsConfig, RpcTransactionLogsFilter},
};
use solana_sdk::{commitment_config::CommitmentConfig, pubkey::Pubkey};
use sqlx::PgPool;
use std::{str::FromStr, sync::Arc};
use tokio::sync::mpsc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NftMintedEvent {
    pub mint: String,
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub creator: String,
}

pub struct WebsocketIndexer {
    db: PgPool,
    config: Config,
    program_id: Pubkey,
}

impl WebsocketIndexer {
    pub fn new(db: PgPool, config: Config) -> Result<Self, AppError> {
        let program_id = Pubkey::from_str(&config.marketplace_program_id)
            .map_err(|_| AppError::ConfigError("Invalid program ID".to_string()))?;

        Ok(Self {
            db,
            config,
            program_id,
        })
    }

    pub async fn start(&self) -> Result<(), AppError> {
        let ws_url = self.config.solana_rpc_url.replace("https://", "wss://");

        loop {
            if let Err(e) = self.run_indexer(&ws_url).await {
                println!("Websocket indexer error: {:?}", e);
                println!("Reconnecting in 5 seconds...");
                tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
            }
        }
    }

    async fn run_indexer(&self, ws_url: &str) -> Result<(), AppError> {
        println!(
            "Starting websocket indexer for program: {}",
            self.program_id
        );

        let (mut notifications, _unsubscribe) = PubsubClient::logs_subscribe(
            ws_url,
            RpcTransactionLogsFilter::Mentions(vec![self.program_id.to_string()]),
            RpcTransactionLogsConfig {
                commitment: Some(CommitmentConfig::confirmed()),
            },
        )
        .map_err(|e| AppError::SolanaError(format!("Failed to subscribe to logs: {}", e)))?;

        while let Some(log) = notifications.next().await {
            if let Err(e) = self.process_log_entry(&log).await {
                println!("Error processing log entry: {:?}", e);
            }
        }

        Ok(())
    }

    async fn process_log_entry(
        &self,
        log: &solana_client::rpc_response::RpcLogsResponse,
    ) -> Result<(), AppError> {
        // Look for NFT_MINTED events in the logs
        for log_line in &log.value.logs {
            if log_line.contains("NFT_MINTED:") {
                if let Some(event_data) = self.extract_nft_event(log_line) {
                    self.handle_nft_minted_event(event_data, &log.value.signature)
                        .await?;
                }
            }
        }

        Ok(())
    }

    fn extract_nft_event(&self, log_line: &str) -> Option<NftMintedEvent> {
        // Extract JSON from log line: "Program log: NFT_MINTED:{...}"
        if let Some(json_start) = log_line.find("NFT_MINTED:") {
            let json_str = &log_line[json_start + 11..]; // Skip "NFT_MINTED:"

            match serde_json::from_str::<NftMintedEvent>(json_str) {
                Ok(event) => Some(event),
                Err(e) => {
                    println!("Failed to parse NFT event JSON: {}", e);
                    None
                }
            }
        } else {
            None
        }
    }

    async fn handle_nft_minted_event(
        &self,
        event: NftMintedEvent,
        signature: &str,
    ) -> Result<(), AppError> {
        println!(
            "Processing NFT minted event: mint={}, name={}, creator={}",
            event.mint, event.name, event.creator
        );

        // Check if NFT already exists in database
        if let Some(_existing_nft) = Nft::find_by_mint(&self.db, &event.mint).await? {
            println!("NFT {} already exists in database", event.mint);
            return Ok(());
        }

        // Fetch additional metadata from the URI if needed
        let (image_url, description, attributes) = self.fetch_metadata(&event.uri).await?;

        // Create NFT record in database
        let create_request = CreateNftRequest {
            mint_address: event.mint.clone(),
            collection_id: None, // Could be extracted from metadata if available
            name: event.name,
            description,
            image_url,
            animation_url: None,
            external_url: None,
            attributes,
            creator_address: event.creator.clone(),
            current_owner: event.creator, // Initially owned by creator
            is_compressed: false,
        };

        match Nft::create(&self.db, create_request).await {
            Ok(nft) => {
                println!(
                    "Successfully indexed NFT: {} ({})",
                    nft.name, nft.mint_address
                );
            }
            Err(e) => {
                println!("Failed to create NFT record: {:?}", e);
                return Err(e);
            }
        }

        Ok(())
    }

    async fn fetch_metadata(
        &self,
        uri: &str,
    ) -> Result<
        (
            Option<String>,
            Option<String>,
            Option<Vec<crate::models::nft::NftAttribute>>,
        ),
        AppError,
    > {
        // Fetch metadata from URI
        match reqwest::get(uri).await {
            Ok(response) => {
                if response.status().is_success() {
                    match response.json::<serde_json::Value>().await {
                        Ok(metadata) => {
                            let image_url = metadata
                                .get("image")
                                .and_then(|v| v.as_str())
                                .map(|s| s.to_string());

                            let description = metadata
                                .get("description")
                                .and_then(|v| v.as_str())
                                .map(|s| s.to_string());

                            let attributes = metadata
                                .get("attributes")
                                .and_then(|v| v.as_array())
                                .map(|attrs| {
                                    attrs
                                        .iter()
                                        .filter_map(|attr| {
                                            let trait_type = attr
                                                .get("trait_type")
                                                .and_then(|v| v.as_str())?
                                                .to_string();
                                            let value = attr.get("value")?.clone();
                                            let display_type = attr
                                                .get("display_type")
                                                .and_then(|v| v.as_str())
                                                .map(|s| s.to_string());

                                            Some(crate::models::nft::NftAttribute {
                                                trait_type,
                                                value,
                                                display_type,
                                            })
                                        })
                                        .collect()
                                });

                            Ok((image_url, description, attributes))
                        }
                        Err(e) => {
                            println!("Failed to parse metadata JSON from {}: {}", uri, e);
                            Ok((None, None, None))
                        }
                    }
                } else {
                    println!(
                        "Failed to fetch metadata from {}: {}",
                        uri,
                        response.status()
                    );
                    Ok((None, None, None))
                }
            }
            Err(e) => Ok((None, None, None)),
        }
    }
}

pub async fn start_websocket_indexer(db: PgPool, config: Config) -> Result<(), AppError> {
    let indexer = WebsocketIndexer::new(db, config)?;
    indexer.start().await
}
