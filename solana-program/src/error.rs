use solana_program::program_error::ProgramError;
use thiserror::Error;

#[derive(Error, Debug, Copy, Clone)]
pub enum MarketplaceError {
    #[error("Invalid instruction")]
    InvalidInstruction,
    #[error("Not rent exempt")]
    NotRentExempt,
    #[error("Expected amount mismatch")]
    ExpectedAmountMismatch,
    #[error("Amount overflow")]
    AmountOverflow,
    #[error("Invalid account owner")]
    InvalidAccountOwner,
    #[error("Account not initialized")]
    AccountNotInitialized,
    #[error("Account already initialized")]
    AccountAlreadyInitialized,
    #[error("Invalid marketplace authority")]
    InvalidMarketplaceAuthority,
    #[error("Invalid seller")]
    InvalidSeller,
    #[error("Invalid buyer")]
    InvalidBuyer,
    #[error("NFT not for sale")]
    NftNotForSale,
    #[error("Insufficient funds")]
    InsufficientFunds,
    #[error("Invalid price")]
    InvalidPrice,
    #[error("Invalid fee percentage")]
    InvalidFeePercentage,
    #[error("Marketplace fee calculation error")]
    MarketplaceFeeCalculationError,
}

impl From<MarketplaceError> for ProgramError {
    fn from(e: MarketplaceError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
