use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use solana_sdk::{
    pubkey::Pubkey,
    signature::{Keypair, Signature},
    signer::Signer,
    transaction::Transaction,
};
use std::str::FromStr;

use super::AppState;
use crate::{
    error::AppError,
    models::{CreateNftRequest, Nft, NftListQuery},
};

pub async fn list_nfts(
    State(state): State<AppState>,
    Query(query): Query<NftListQuery>,
) -> Result<Json<Value>, AppError> {
    let nfts = Nft::list(&state.db, query.clone()).await?;
    let total = Nft::count(&state.db, &query).await?;

    Ok(Json(json!({
        "nfts": nfts,
        "pagination": {
            "total": total,
            "page": query.page.unwrap_or(0),
            "limit": query.limit.unwrap_or(20),
            "has_more": (query.page.unwrap_or(0) + 1) * query.limit.unwrap_or(20) < total
        }
    })))
}

pub async fn get_nft(
    State(state): State<AppState>,
    Path(mint): Path<String>,
) -> Result<Json<Value>, AppError> {
    let nft = Nft::find_by_mint(&state.db, &mint)
        .await?
        .ok_or_else(|| crate::error::not_found_error("NFT"))?;

    Ok(Json(json!({
        "nft": nft
    })))
}

#[derive(Debug, Deserialize)]
pub struct MintNftRequest {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub creator: String,
}

#[derive(Debug, Serialize)]
pub struct MintNftResponse {
    pub transaction: Vec<u8>,
    pub mint_address: String,
}

#[derive(Debug, Deserialize)]
pub struct SendTransactionRequest {
    pub signed_transaction: Vec<u8>,
}

#[derive(Debug, Serialize)]
pub struct SendTransactionResponse {
    pub signature: String,
    pub mint_address: String,
}

pub async fn mint_nft(
    State(state): State<AppState>,
    Json(req): Json<MintNftRequest>,
) -> Result<Json<MintNftResponse>, AppError> {
    // Generate a new keypair for the mint account
    let mint_keypair = Keypair::new();
    let mint_address = mint_keypair.pubkey();

    // Parse creator pubkey
    let creator_pubkey = Pubkey::from_str(&req.creator)
        .map_err(|_| AppError::ValidationError("Invalid creator address".to_string()))?;

    // Parse program ID
    let program_id = Pubkey::from_str(&state.config.marketplace_program_id)
        .map_err(|_| AppError::ConfigError("Invalid program ID".to_string()))?;

    // Get associated token account
    let associated_token_account =
        spl_associated_token_account::get_associated_token_address(&creator_pubkey, &mint_address);

    // Create mint NFT instruction
    let instruction = solana_program::instruction::Instruction {
        program_id,
        accounts: vec![
            solana_program::instruction::AccountMeta::new(creator_pubkey, true),
            solana_program::instruction::AccountMeta::new(mint_address, false),
            solana_program::instruction::AccountMeta::new(associated_token_account, false),
            solana_program::instruction::AccountMeta::new_readonly(spl_token::id(), false),
            solana_program::instruction::AccountMeta::new_readonly(
                spl_associated_token_account::id(),
                false,
            ),
            solana_program::instruction::AccountMeta::new_readonly(
                solana_program::system_program::id(),
                false,
            ),
            solana_program::instruction::AccountMeta::new_readonly(
                solana_program::sysvar::rent::id(),
                false,
            ),
        ],
        data: {
            use borsh::BorshSerialize;
            #[derive(BorshSerialize)]
            enum MarketplaceInstruction {
                MintNft {
                    name: String,
                    symbol: String,
                    uri: String,
                },
            }
            MarketplaceInstruction::MintNft {
                name: req.name.clone(),
                symbol: req.symbol.clone(),
                uri: req.uri.clone(),
            }
            .try_to_vec()
            .map_err(|e| AppError::Serialization(e))?
        },
    };

    // Get recent blockhash
    let recent_blockhash = state.solana_client.get_latest_blockhash().await?;

    // Create transaction
    let mut transaction = Transaction::new_with_payer(&[instruction], Some(&creator_pubkey));
    transaction.partial_sign(&[&mint_keypair], recent_blockhash);

    Ok(Json(MintNftResponse {
        transaction: bincode::serialize(&transaction).map_err(|e| AppError::Serialization(e))?,
        mint_address: mint_address.to_string(),
    }))
}

pub async fn send_transaction(
    State(state): State<AppState>,
    Json(req): Json<SendTransactionRequest>,
) -> Result<Json<SendTransactionResponse>, AppError> {
    // Deserialize the signed transaction
    let transaction: Transaction = bincode::deserialize(&req.signed_transaction).map_err(|e| {
        AppError::Deserialization(format!("Failed to deserialize transaction: {}", e))
    })?;

    // Send the transaction
    let signature = state
        .solana_client
        .send_and_confirm_transaction(&transaction)?;

    // Extract mint address from transaction (first account after payer)
    let mint_address = if transaction.message.account_keys.len() > 1 {
        transaction.message.account_keys[1].to_string()
    } else {
        return Err(AppError::ValidationError(
            "Invalid transaction structure".to_string(),
        ));
    };

    Ok(Json(SendTransactionResponse {
        signature: signature.to_string(),
        mint_address,
    }))
}
