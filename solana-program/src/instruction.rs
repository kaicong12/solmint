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

    /// Update marketplace fee
    ///
    /// Accounts expected:
    /// 0. `[signer]` Marketplace authority
    /// 1. `[writable]` Marketplace account
    UpdateMarketplaceFee { new_fee_percentage: u16 },

    /// Mint NFT
    ///
    /// Accounts expected:
    /// 0. `[signer]` Mint authority/fee payer
    /// 1. `[writable]` Mint account to create
    /// 2. `[writable]` Associated token account to create
    /// 3. `[]` Token program
    /// 4. `[]` Associated token program
    /// 5. `[]` System program
    /// 6. `[]` Rent sysvar
    MintNft {
        name: String,
        symbol: String,
        uri: String,
    },
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

/// Create a mint NFT instruction
pub fn mint_nft(
    program_id: &Pubkey,
    mint_authority: &Pubkey,
    mint_account: &Pubkey,
    associated_token_account: &Pubkey,
    token_program: &Pubkey,
    associated_token_program: &Pubkey,
    name: String,
    symbol: String,
    uri: String,
) -> Instruction {
    let accounts = vec![
        AccountMeta::new(*mint_authority, true),
        AccountMeta::new(*mint_account, false),
        AccountMeta::new(*associated_token_account, false),
        AccountMeta::new_readonly(*token_program, false),
        AccountMeta::new_readonly(*associated_token_program, false),
        AccountMeta::new_readonly(system_program::id(), false),
        AccountMeta::new_readonly(solana_program::sysvar::rent::id(), false),
    ];

    Instruction {
        program_id: *program_id,
        accounts,
        data: MarketplaceInstruction::MintNft { name, symbol, uri }.pack(),
    }
}
