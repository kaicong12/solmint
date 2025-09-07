use crate::{
    error::MarketplaceError,
    instruction::MarketplaceInstruction,
    state::{Listing, Marketplace},
};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    clock::Clock,
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
            MarketplaceInstruction::ListNft { price } => {
                msg!("Instruction: ListNft");
                Self::process_list_nft(program_id, accounts, price)
            }
            MarketplaceInstruction::BuyNft => {
                msg!("Instruction: BuyNft");
                Self::process_buy_nft(program_id, accounts)
            }
            MarketplaceInstruction::CancelListing => {
                msg!("Instruction: CancelListing");
                Self::process_cancel_listing(program_id, accounts)
            }
            MarketplaceInstruction::UpdateMarketplaceFee { new_fee_percentage } => {
                msg!("Instruction: UpdateMarketplaceFee");
                Self::process_update_marketplace_fee(program_id, accounts, new_fee_percentage)
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

    fn process_list_nft(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        price: u64,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let seller_info = next_account_info(account_info_iter)?;
        let listing_info = next_account_info(account_info_iter)?;
        let nft_mint_info = next_account_info(account_info_iter)?;
        let _seller_token_info = next_account_info(account_info_iter)?;
        let marketplace_info = next_account_info(account_info_iter)?;
        let system_program_info = next_account_info(account_info_iter)?;
        let rent_info = next_account_info(account_info_iter)?;

        // Validate price
        if price == 0 {
            return Err(MarketplaceError::InvalidPrice.into());
        }

        // Verify seller is signer
        if !seller_info.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        // Verify marketplace is initialized
        let marketplace = Marketplace::unpack(&marketplace_info.data.borrow())?;
        if !marketplace.is_initialized() {
            return Err(MarketplaceError::AccountNotInitialized.into());
        }

        // Verify listing account is uninitialized
        if listing_info.owner != &solana_program::system_program::id() {
            return Err(MarketplaceError::AccountAlreadyInitialized.into());
        }

        let rent = Rent::from_account_info(rent_info)?;
        let clock = Clock::get()?;

        // Calculate required space and rent for listing
        let space = Listing::LEN;
        let required_lamports = rent.minimum_balance(space);

        // Derive listing PDA
        let (listing_pda, listing_bump) =
            crate::state::get_listing_pda(program_id, nft_mint_info.key, seller_info.key);

        if listing_pda != *listing_info.key {
            return Err(ProgramError::InvalidSeeds);
        }

        // Create listing account
        invoke_signed(
            &system_instruction::create_account(
                seller_info.key,
                listing_info.key,
                required_lamports,
                space as u64,
                program_id,
            ),
            &[
                seller_info.clone(),
                listing_info.clone(),
                system_program_info.clone(),
            ],
            &[&[
                b"listing",
                nft_mint_info.key.as_ref(),
                seller_info.key.as_ref(),
                &[listing_bump],
            ]],
        )?;

        // Initialize listing data
        let listing = Listing::new(
            *seller_info.key,
            *nft_mint_info.key,
            price,
            clock.unix_timestamp,
            *marketplace_info.key,
        );

        Listing::pack(listing, &mut listing_info.data.borrow_mut())?;

        msg!("NFT listed for sale at price: {} lamports", price);
        Ok(())
    }

    fn process_buy_nft(_program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let buyer_info = next_account_info(account_info_iter)?;
        let listing_info = next_account_info(account_info_iter)?;
        let _buyer_token_info = next_account_info(account_info_iter)?;
        let _seller_token_info = next_account_info(account_info_iter)?;
        let seller_info = next_account_info(account_info_iter)?;
        let marketplace_fee_info = next_account_info(account_info_iter)?;
        let nft_mint_info = next_account_info(account_info_iter)?;
        let marketplace_info = next_account_info(account_info_iter)?;
        let _token_program_info = next_account_info(account_info_iter)?;
        let system_program_info = next_account_info(account_info_iter)?;

        // Verify buyer is signer
        if !buyer_info.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        // Load listing data
        let listing = Listing::unpack(&listing_info.data.borrow())?;
        if !listing.is_initialized() {
            return Err(MarketplaceError::AccountNotInitialized.into());
        }

        // Load marketplace data
        let mut marketplace = Marketplace::unpack(&marketplace_info.data.borrow())?;
        if !marketplace.is_initialized() {
            return Err(MarketplaceError::AccountNotInitialized.into());
        }

        // Verify listing matches the NFT mint
        if listing.nft_mint != *nft_mint_info.key {
            return Err(MarketplaceError::ExpectedAmountMismatch.into());
        }

        // Verify seller matches listing
        if listing.seller != *seller_info.key {
            return Err(MarketplaceError::InvalidSeller.into());
        }

        // Calculate fees and seller proceeds
        let marketplace_fee = marketplace.calculate_fee(listing.price)?;
        let seller_proceeds = marketplace.calculate_seller_proceeds(listing.price)?;

        // Verify buyer has sufficient funds
        if buyer_info.lamports() < listing.price {
            return Err(MarketplaceError::InsufficientFunds.into());
        }

        // Transfer payment to seller
        invoke(
            &system_instruction::transfer(buyer_info.key, seller_info.key, seller_proceeds),
            &[
                buyer_info.clone(),
                seller_info.clone(),
                system_program_info.clone(),
            ],
        )?;

        // Transfer marketplace fee
        if marketplace_fee > 0 {
            invoke(
                &system_instruction::transfer(
                    buyer_info.key,
                    marketplace_fee_info.key,
                    marketplace_fee,
                ),
                &[
                    buyer_info.clone(),
                    marketplace_fee_info.clone(),
                    system_program_info.clone(),
                ],
            )?;
        }

        // Note: In a production implementation, you would handle the NFT transfer here
        // using the SPL Token program. For this example, we're focusing on the marketplace logic.
        // The NFT transfer would typically involve:
        // 1. Verifying token account ownership
        // 2. Creating transfer instruction
        // 3. Invoking the token program
        msg!("NFT transfer would be handled here in production");

        // Update marketplace statistics
        marketplace.total_volume = marketplace
            .total_volume
            .checked_add(listing.price)
            .ok_or(MarketplaceError::AmountOverflow)?;
        marketplace.total_sales = marketplace
            .total_sales
            .checked_add(1)
            .ok_or(MarketplaceError::AmountOverflow)?;

        Marketplace::pack(marketplace, &mut marketplace_info.data.borrow_mut())?;

        // Close listing account and return rent to seller
        let listing_lamports = listing_info.lamports();
        **listing_info.lamports.borrow_mut() = 0;
        **seller_info.lamports.borrow_mut() = seller_info
            .lamports()
            .checked_add(listing_lamports)
            .ok_or(MarketplaceError::AmountOverflow)?;

        msg!("NFT sold for {} lamports", listing.price);
        Ok(())
    }

    fn process_cancel_listing(_program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let seller_info = next_account_info(account_info_iter)?;
        let listing_info = next_account_info(account_info_iter)?;
        let nft_mint_info = next_account_info(account_info_iter)?;

        // Verify seller is signer
        if !seller_info.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        // Load listing data
        let listing = Listing::unpack(&listing_info.data.borrow())?;
        if !listing.is_initialized() {
            return Err(MarketplaceError::AccountNotInitialized.into());
        }

        // Verify seller owns the listing
        if listing.seller != *seller_info.key {
            return Err(MarketplaceError::InvalidSeller.into());
        }

        // Verify NFT mint matches
        if listing.nft_mint != *nft_mint_info.key {
            return Err(MarketplaceError::ExpectedAmountMismatch.into());
        }

        // Close listing account and return rent to seller
        let listing_lamports = listing_info.lamports();
        **listing_info.lamports.borrow_mut() = 0;
        **seller_info.lamports.borrow_mut() = seller_info
            .lamports()
            .checked_add(listing_lamports)
            .ok_or(MarketplaceError::AmountOverflow)?;

        msg!("Listing cancelled for NFT mint: {}", nft_mint_info.key);
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
}
