use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    program_pack::{IsInitialized, Pack, Sealed},
    pubkey::Pubkey,
};

/// Marketplace account data
#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct Marketplace {
    pub is_initialized: bool,
    pub authority: Pubkey,
    pub fee_percentage: u16, // Fee percentage in basis points (e.g., 250 = 2.5%)
    pub fee_recipient: Pubkey,
}

impl Marketplace {
    pub const LEN: usize = 1 + 32 + 2 + 32; // 65 bytes

    pub fn new(authority: Pubkey, fee_percentage: u16, fee_recipient: Pubkey) -> Self {
        Self {
            is_initialized: true,
            authority,
            fee_percentage,
            fee_recipient,
        }
    }

    pub fn calculate_fee(&self, price: u64) -> Result<u64, crate::error::MarketplaceError> {
        let fee = (price as u128)
            .checked_mul(self.fee_percentage as u128)
            .ok_or(crate::error::MarketplaceError::AmountOverflow)?
            .checked_div(10000) // Basis points conversion
            .ok_or(crate::error::MarketplaceError::MarketplaceFeeCalculationError)?;

        if fee > u64::MAX as u128 {
            return Err(crate::error::MarketplaceError::AmountOverflow);
        }

        Ok(fee as u64)
    }

    pub fn calculate_seller_proceeds(
        &self,
        price: u64,
    ) -> Result<u64, crate::error::MarketplaceError> {
        let fee = self.calculate_fee(price)?;
        price
            .checked_sub(fee)
            .ok_or(crate::error::MarketplaceError::AmountOverflow)
    }
}

impl Sealed for Marketplace {}

impl IsInitialized for Marketplace {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}

impl Pack for Marketplace {
    const LEN: usize = Self::LEN;

    fn pack_into_slice(&self, dst: &mut [u8]) {
        let data = self.try_to_vec().unwrap();
        dst[..data.len()].copy_from_slice(&data);
    }

    fn unpack_from_slice(src: &[u8]) -> Result<Self, solana_program::program_error::ProgramError> {
        Self::try_from_slice(src)
            .map_err(|_| solana_program::program_error::ProgramError::InvalidAccountData)
    }
}

/// Helper function to get marketplace PDA
pub fn get_marketplace_pda(program_id: &Pubkey, authority: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"marketplace", authority.as_ref()], program_id)
}
