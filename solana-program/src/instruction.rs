use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    system_program,
};

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub enum MarketplaceInstruction {
    /// Initialize a new marketplace
    ///
    /// Accounts expected:
    /// 0. `[signer]` Marketplace authority
    /// 1. `[writable]` Marketplace account to initialize
    /// 2. `[]` System program
    /// 3. `[]` Rent sysvar
    InitializeMarketplace {
        fee_percentage: u16, // Fee percentage in basis points (e.g., 250 = 2.5%)
    },

    /// List an NFT for sale
    ///
    /// Accounts expected:
    /// 0. `[signer]` NFT owner/seller
    /// 1. `[writable]` Listing account to create
    /// 2. `[]` NFT mint account
    /// 3. `[writable]` NFT token account (seller's)
    /// 4. `[]` Marketplace account
    /// 5. `[]` System program
    /// 6. `[]` Rent sysvar
    ListNft {
        price: u64, // Price in lamports
    },

    /// Buy an NFT
    ///
    /// Accounts expected:
    /// 0. `[signer]` Buyer
    /// 1. `[writable]` Listing account
    /// 2. `[writable]` Buyer's token account
    /// 3. `[writable]` Seller's token account
    /// 4. `[writable]` Seller account (to receive payment)
    /// 5. `[writable]` Marketplace fee account
    /// 6. `[]` NFT mint account
    /// 7. `[]` Marketplace account
    /// 8. `[]` Token program
    /// 9. `[]` System program
    BuyNft,

    /// Cancel an NFT listing
    ///
    /// Accounts expected:
    /// 0. `[signer]` NFT owner/seller
    /// 1. `[writable]` Listing account to close
    /// 2. `[]` NFT mint account
    CancelListing,

    /// Update marketplace fee
    ///
    /// Accounts expected:
    /// 0. `[signer]` Marketplace authority
    /// 1. `[writable]` Marketplace account
    UpdateMarketplaceFee { new_fee_percentage: u16 },
}

impl MarketplaceInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, std::io::Error> {
        Self::try_from_slice(input)
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))
    }

    pub fn pack(&self) -> Vec<u8> {
        self.try_to_vec().unwrap()
    }
}

/// Create an initialize marketplace instruction
pub fn initialize_marketplace(
    program_id: &Pubkey,
    marketplace_authority: &Pubkey,
    marketplace_account: &Pubkey,
    fee_percentage: u16,
) -> Instruction {
    let accounts = vec![
        AccountMeta::new(*marketplace_authority, true),
        AccountMeta::new(*marketplace_account, false),
        AccountMeta::new_readonly(system_program::id(), false),
        AccountMeta::new_readonly(solana_program::sysvar::rent::id(), false),
    ];

    Instruction {
        program_id: *program_id,
        accounts,
        data: MarketplaceInstruction::InitializeMarketplace { fee_percentage }.pack(),
    }
}

/// Create a list NFT instruction
pub fn list_nft(
    program_id: &Pubkey,
    seller: &Pubkey,
    listing_account: &Pubkey,
    nft_mint: &Pubkey,
    seller_token_account: &Pubkey,
    marketplace_account: &Pubkey,
    price: u64,
) -> Instruction {
    let accounts = vec![
        AccountMeta::new(*seller, true),
        AccountMeta::new(*listing_account, false),
        AccountMeta::new_readonly(*nft_mint, false),
        AccountMeta::new(*seller_token_account, false),
        AccountMeta::new_readonly(*marketplace_account, false),
        AccountMeta::new_readonly(system_program::id(), false),
        AccountMeta::new_readonly(solana_program::sysvar::rent::id(), false),
    ];

    Instruction {
        program_id: *program_id,
        accounts,
        data: MarketplaceInstruction::ListNft { price }.pack(),
    }
}

/// Create a buy NFT instruction
pub fn buy_nft(
    program_id: &Pubkey,
    buyer: &Pubkey,
    listing_account: &Pubkey,
    buyer_token_account: &Pubkey,
    seller_token_account: &Pubkey,
    seller_account: &Pubkey,
    marketplace_fee_account: &Pubkey,
    nft_mint: &Pubkey,
    marketplace_account: &Pubkey,
    token_program: &Pubkey,
) -> Instruction {
    let accounts = vec![
        AccountMeta::new(*buyer, true),
        AccountMeta::new(*listing_account, false),
        AccountMeta::new(*buyer_token_account, false),
        AccountMeta::new(*seller_token_account, false),
        AccountMeta::new(*seller_account, false),
        AccountMeta::new(*marketplace_fee_account, false),
        AccountMeta::new_readonly(*nft_mint, false),
        AccountMeta::new_readonly(*marketplace_account, false),
        AccountMeta::new_readonly(*token_program, false),
        AccountMeta::new_readonly(system_program::id(), false),
    ];

    Instruction {
        program_id: *program_id,
        accounts,
        data: MarketplaceInstruction::BuyNft.pack(),
    }
}

/// Create a cancel listing instruction
pub fn cancel_listing(
    program_id: &Pubkey,
    seller: &Pubkey,
    listing_account: &Pubkey,
    nft_mint: &Pubkey,
) -> Instruction {
    let accounts = vec![
        AccountMeta::new(*seller, true),
        AccountMeta::new(*listing_account, false),
        AccountMeta::new_readonly(*nft_mint, false),
    ];

    Instruction {
        program_id: *program_id,
        accounts,
        data: MarketplaceInstruction::CancelListing.pack(),
    }
}

/// Create an update marketplace fee instruction
pub fn update_marketplace_fee(
    program_id: &Pubkey,
    marketplace_authority: &Pubkey,
    marketplace_account: &Pubkey,
    new_fee_percentage: u16,
) -> Instruction {
    let accounts = vec![
        AccountMeta::new(*marketplace_authority, true),
        AccountMeta::new(*marketplace_account, false),
    ];

    Instruction {
        program_id: *program_id,
        accounts,
        data: MarketplaceInstruction::UpdateMarketplaceFee { new_fee_percentage }.pack(),
    }
}
