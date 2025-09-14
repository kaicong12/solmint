use crate::{error::MarketplaceError, instruction::MarketplaceInstruction, state::Marketplace};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program::{invoke, invoke_signed},
    program_error::ProgramError,
    program_pack::{IsInitialized, Pack},
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
    sysvar::Sysvar,
};
use spl_associated_token_account::instruction::create_associated_token_account;
use spl_token::{
    instruction::{initialize_mint, mint_to},
    state::Mint,
};

pub struct Processor;

impl Processor {
    pub fn process(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        let instruction = MarketplaceInstruction::unpack(instruction_data)?;

        match instruction {
            MarketplaceInstruction::InitializeMarketplace { fee_percentage } => {
                msg!("Instruction: InitializeMarketplace");
                Self::process_initialize_marketplace(program_id, accounts, fee_percentage)
            }
            MarketplaceInstruction::UpdateMarketplaceFee { new_fee_percentage } => {
                msg!("Instruction: UpdateMarketplaceFee");
                Self::process_update_marketplace_fee(program_id, accounts, new_fee_percentage)
            }
            MarketplaceInstruction::MintNft { name, symbol, uri } => {
                msg!("Instruction: MintNft");
                Self::process_mint_nft(program_id, accounts, name, symbol, uri)
            }
        }
    }

    fn process_initialize_marketplace(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        fee_percentage: u16,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let authority_info = next_account_info(account_info_iter)?;
        let marketplace_info = next_account_info(account_info_iter)?;
        let system_program_info = next_account_info(account_info_iter)?;
        let rent_info = next_account_info(account_info_iter)?;

        // Validate fee percentage (max 10% = 1000 basis points)
        if fee_percentage > 1000 {
            return Err(MarketplaceError::InvalidFeePercentage.into());
        }

        // Verify authority is signer
        if !authority_info.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        // Verify marketplace account is owned by system program (uninitialized)
        if marketplace_info.owner != &solana_program::system_program::id() {
            return Err(MarketplaceError::InvalidAccountOwner.into());
        }

        let rent = Rent::from_account_info(rent_info)?;

        // Calculate required space and rent
        let space = Marketplace::LEN;
        let required_lamports = rent.minimum_balance(space);

        // Create marketplace account
        let (marketplace_pda, marketplace_bump) =
            crate::state::get_marketplace_pda(program_id, authority_info.key);

        if marketplace_pda != *marketplace_info.key {
            return Err(ProgramError::InvalidSeeds);
        }

        invoke_signed(
            &system_instruction::create_account(
                authority_info.key,
                marketplace_info.key,
                required_lamports,
                space as u64,
                program_id,
            ),
            &[
                authority_info.clone(),
                marketplace_info.clone(),
                system_program_info.clone(),
            ],
            &[&[
                b"marketplace",
                authority_info.key.as_ref(),
                &[marketplace_bump],
            ]],
        )?;

        // Initialize marketplace data
        let marketplace = Marketplace::new(
            *authority_info.key,
            fee_percentage,
            *authority_info.key, // Authority is also the fee recipient initially
        );

        Marketplace::pack(marketplace, &mut marketplace_info.data.borrow_mut())?;

        msg!(
            "Marketplace initialized with fee percentage: {}",
            fee_percentage
        );
        Ok(())
    }

    fn process_update_marketplace_fee(
        _program_id: &Pubkey,
        accounts: &[AccountInfo],
        new_fee_percentage: u16,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let authority_info = next_account_info(account_info_iter)?;
        let marketplace_info = next_account_info(account_info_iter)?;

        // Validate new fee percentage (max 10% = 1000 basis points)
        if new_fee_percentage > 1000 {
            return Err(MarketplaceError::InvalidFeePercentage.into());
        }

        // Verify authority is signer
        if !authority_info.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        // Load marketplace data
        let mut marketplace = Marketplace::unpack(&marketplace_info.data.borrow())?;
        if !marketplace.is_initialized() {
            return Err(MarketplaceError::AccountNotInitialized.into());
        }

        // Verify authority
        if marketplace.authority != *authority_info.key {
            return Err(MarketplaceError::InvalidMarketplaceAuthority.into());
        }

        // Update fee percentage
        marketplace.fee_percentage = new_fee_percentage;
        Marketplace::pack(marketplace, &mut marketplace_info.data.borrow_mut())?;

        msg!("Marketplace fee updated to: {}", new_fee_percentage);
        Ok(())
    }

    fn process_mint_nft(
        _program_id: &Pubkey,
        accounts: &[AccountInfo],
        name: String,
        symbol: String,
        uri: String,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let mint_authority_info = next_account_info(account_info_iter)?;
        let mint_info = next_account_info(account_info_iter)?;
        let associated_token_account_info = next_account_info(account_info_iter)?;
        let token_program_info = next_account_info(account_info_iter)?;
        let associated_token_program_info = next_account_info(account_info_iter)?;
        let system_program_info = next_account_info(account_info_iter)?;
        let rent_info = next_account_info(account_info_iter)?;

        // Verify mint authority is signer
        if !mint_authority_info.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        // Verify mint account is owned by system program (uninitialized)
        if mint_info.owner != &solana_program::system_program::id() {
            return Err(MarketplaceError::InvalidAccountOwner.into());
        }

        let rent = Rent::from_account_info(rent_info)?;

        // Calculate required space and rent for mint account
        let mint_space = Mint::LEN;
        let mint_rent = rent.minimum_balance(mint_space);

        // Create mint account
        invoke(
            &system_instruction::create_account(
                mint_authority_info.key,
                mint_info.key,
                mint_rent,
                mint_space as u64,
                token_program_info.key,
            ),
            &[
                mint_authority_info.clone(),
                mint_info.clone(),
                system_program_info.clone(),
            ],
        )?;

        // Initialize mint account with 0 decimals for NFT
        invoke(
            &initialize_mint(
                token_program_info.key,
                mint_info.key,
                mint_authority_info.key,
                Some(mint_authority_info.key), // freeze authority
                0,                             // 0 decimals for NFT
            )?,
            &[
                mint_info.clone(),
                rent_info.clone(),
                token_program_info.clone(),
            ],
        )?;

        // Create associated token account
        invoke(
            &create_associated_token_account(
                mint_authority_info.key,
                mint_authority_info.key,
                mint_info.key,
                token_program_info.key,
            ),
            &[
                mint_authority_info.clone(),
                associated_token_account_info.clone(),
                mint_authority_info.clone(),
                mint_info.clone(),
                system_program_info.clone(),
                token_program_info.clone(),
                associated_token_program_info.clone(),
            ],
        )?;

        // Mint 1 token (NFT) to the associated token account
        invoke(
            &mint_to(
                token_program_info.key,
                mint_info.key,
                associated_token_account_info.key,
                mint_authority_info.key,
                &[mint_authority_info.key],
                1, // Mint 1 NFT
            )?,
            &[
                mint_info.clone(),
                associated_token_account_info.clone(),
                mint_authority_info.clone(),
                token_program_info.clone(),
            ],
        )?;

        msg!(
            "NFT minted successfully! Name: {}, Symbol: {}, URI: {}, Mint: {}",
            name,
            symbol,
            uri,
            mint_info.key
        );
        Ok(())
    }
}
