use solana_client::rpc_client::RpcClient;
use solana_sdk::{commitment_config::CommitmentConfig, pubkey::Pubkey, signature::Signature};
use sqlx::PgPool;
use std::{str::FromStr, sync::Arc, time::Duration};
use tokio::time::sleep;

use crate::{
    config::Config,
    error::AppError,
    models::{
        Activity, CreateActivityRequest, CreateListingRequest, CreateNftRequest, CreateSaleRequest,
        Listing, Nft, Sale, UpdateListingRequest,
    },
};

pub struct SolanaIndexer {
    db: PgPool,
    solana_client: Arc<RpcClient>,
    config: Config,
}

impl SolanaIndexer {
    pub fn new(db: PgPool, solana_client: Arc<RpcClient>, config: Config) -> Self {
        Self {
            db,
            solana_client,
            config,
        }
    }

    pub async fn start(&self) -> Result<(), AppError> {
        tracing::info!("Starting Solana indexer...");

        loop {
            if let Err(e) = self.process_transactions().await {
                tracing::error!("Indexer error: {:?}", e);
                sleep(Duration::from_secs(10)).await;
            }

            sleep(Duration::from_secs(self.config.indexer_interval_seconds)).await;
        }
    }

    async fn process_transactions(&self) -> Result<(), AppError> {
        // Get the last processed slot from database
        let last_slot = self.get_last_processed_slot().await?;
        
        // Get current slot
        let current_slot = self.solana_client.get_slot()?;
        
        if current_slot <= last_slot {
            return Ok(());
        }

        tracing::info!("Processing slots {} to {}", last_slot + 1, current_slot);

        // Process transactions in batches
        let batch_size = 100;
        for start_slot in ((last_slot + 1)..=current_slot).step_by(batch_size) {
            let end_slot = (start_slot + batch_size as u64 - 1).min(current_slot);
            
            if let Err(e) = self.process_slot_range(start_slot, end_slot).await {
                tracing::error!("Error processing slots {} to {}: {:?}", start_slot, end_slot, e);
                continue;
            }
        }

        // Update last processed slot
        self.update_last_processed_slot(current_slot).await?;

        Ok(())
    }

    async fn process_slot_range(&self, start_slot: u64, end_slot: u64) -> Result<(), AppError> {
        // Get confirmed blocks in the range
        let blocks = self
            .solana_client
            .get_blocks_with_commitment(start_slot, Some(end_slot), CommitmentConfig::confirmed())?;

        for slot in blocks {
            if let Err(e) = self.process_block(slot).await {
                tracing::error!("Error processing block {}: {:?}", slot, e);
                continue;
            }
        }

        Ok(())
    }

    async fn process_block(&self, slot: u64) -> Result<(), AppError> {
        let block = self
            .solana_client
            .get_block_with_config(
                slot,
                solana_client::rpc_config::RpcBlockConfig {
                    encoding: Some(solana_account_decoder::UiTransactionEncoding::Json),
                    transaction_details: Some(
                        solana_transaction_status::TransactionDetails::Full,
                    ),
                    rewards: Some(false),
                    commitment: Some(CommitmentConfig::confirmed()),
                    max_supported_transaction_version: Some(0),
                },
            )?;

        if let Some(transactions) = block.transactions {
            for tx in transactions {
                if let Some(transaction) = tx.transaction.decode() {
                    if let Err(e) = self.process_transaction(&transaction, &tx).await {
                        tracing::error!("Error processing transaction: {:?}", e);
                        continue;
                    }
                }
            }
        }

        Ok(())
    }

    async fn process_transaction(
        &self,
        transaction: &solana_sdk::transaction::VersionedTransaction,
        tx_with_meta: &solana_transaction_status::EncodedTransactionWithStatusMeta,
    ) -> Result<(), AppError> {
        let signature = transaction.signatures[0];
        
        // Check if this is a marketplace program transaction
        let marketplace_program_id = Pubkey::from_str(&self.config.marketplace_program_id)
            .map_err(|_| AppError::ConfigError("Invalid marketplace program ID".to_string()))?;

        let mut is_marketplace_tx = false;
        for account_key in transaction.message.static_account_keys() {
            if *account_key == marketplace_program_id {
                is_marketplace_tx = true;
                break;
            }
        }

        if !is_marketplace_tx {
            return Ok(());
        }

        // Parse the transaction based on instruction data
        if let Some(meta) = &tx_with_meta.meta {
            let block_time = tx_with_meta.block_time.map(|t| {
                chrono::DateTime::from_timestamp(t, 0)
                    .unwrap_or_else(|| chrono::Utc::now())
            }).unwrap_or_else(|| chrono::Utc::now());

            // Process different instruction types
            self.process_marketplace_instruction(
                &signature,
                &transaction,
                meta,
                block_time,
            ).await?;
        }

        Ok(())
    }

    async fn process_marketplace_instruction(
        &self,
        signature: &Signature,
        transaction: &solana_sdk::transaction::VersionedTransaction,
        meta: &solana_transaction_status::UiTransactionStatusMeta,
        block_time: chrono::DateTime<chrono::Utc>,
    ) -> Result<(), AppError> {
        // This is a simplified version - in a real implementation, you would:
        // 1. Parse the instruction data to determine the instruction type
        // 2. Extract relevant account addresses and data
        // 3. Update the database accordingly

        // For now, let's create a generic activity record
        let activity_req = CreateActivityRequest {
            activity_type: "transaction".to_string(),
            nft_mint: "placeholder".to_string(), // Would extract from instruction data
            from_address: None,
            to_address: None,
            price: None,
            transaction_signature: Some(signature.to_string()),
            block_time,
        };

        // Only create activity if we can extract meaningful data
        if activity_req.nft_mint != "placeholder" {
            Activity::create(&self.db, activity_req).await?;
        }

        Ok(())
    }

    async fn get_last_processed_slot(&self) -> Result<u64, AppError> {
        let result = sqlx::query!(
            "SELECT last_processed_slot FROM indexer_state ORDER BY updated_at DESC LIMIT 1"
        )
        .fetch_optional(&self.db)
        .await?;

        Ok(result.map(|r| r.last_processed_slot as u64).unwrap_or(0))
    }

    async fn update_last_processed_slot(&self, slot: u64) -> Result<(), AppError> {
        sqlx::query!(
            r#"
            INSERT INTO indexer_state (last_processed_slot)
            VALUES ($1)
            ON CONFLICT (id) DO UPDATE SET
                last_processed_slot = $1,
                updated_at = NOW()
            "#,
            slot as i64
        )
        .execute(&self.db)
        .await?;

        Ok(())
    }
}

pub async fn start_indexer(
    db: PgPool,
    solana_client: Arc<RpcClient>,
    config: Config,
) -> Result<(), AppError> {
    let indexer = SolanaIndexer::new(db, solana_client, config);
    indexer.start().await
}
