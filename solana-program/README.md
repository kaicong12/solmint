# NFT Marketplace Solana Program

A native Rust Solana program for an NFT marketplace built using the Solana SDK v2.2.0.

## Overview

This program implements a decentralized NFT marketplace on Solana with the following core features:

- **Initialize Marketplace**: Create a new marketplace with configurable fees
- **List NFT**: List an NFT for sale at a specified price
- **Buy NFT**: Purchase a listed NFT with automatic fee distribution
- **Cancel Listing**: Remove an NFT listing from the marketplace
- **Update Marketplace Fee**: Modify marketplace fee percentage (admin only)

## Program Structure

### Core Modules

- **`lib.rs`**: Program entry point and instruction routing
- **`instruction.rs`**: Instruction definitions and helper functions
- **`processor.rs`**: Business logic for handling instructions
- **`state.rs`**: Account data structures and helper functions
- **`error.rs`**: Custom error definitions

### Key Features

#### Marketplace Account

- Stores marketplace configuration and statistics
- Tracks total volume and sales count
- Configurable fee percentage (max 10%)
- Authority-controlled fee updates

#### Listing Account

- Represents an NFT listing on the marketplace
- Contains seller, NFT mint, price, and timestamp information
- Uses Program Derived Addresses (PDAs) for deterministic addressing

#### Fee Management

- Basis points system (e.g., 250 = 2.5%)
- Automatic fee calculation and distribution
- Separate marketplace fee account for fee collection

## Instructions

### 1. Initialize Marketplace

Creates a new marketplace instance.

**Accounts:**

- `[signer]` Marketplace authority
- `[writable]` Marketplace account (PDA)
- `[]` System program
- `[]` Rent sysvar

**Parameters:**

- `fee_percentage`: Fee in basis points (max 1000 = 10%)

### 2. List NFT

Lists an NFT for sale on the marketplace.

**Accounts:**

- `[signer]` NFT owner/seller
- `[writable]` Listing account (PDA)
- `[]` NFT mint account
- `[writable]` Seller's token account
- `[]` Marketplace account
- `[]` System program
- `[]` Rent sysvar

**Parameters:**

- `price`: Price in lamports

### 3. Buy NFT

Purchases a listed NFT.

**Accounts:**

- `[signer]` Buyer
- `[writable]` Listing account
- `[writable]` Buyer's token account
- `[writable]` Seller's token account
- `[writable]` Seller account
- `[writable]` Marketplace fee account
- `[]` NFT mint account
- `[]` Marketplace account
- `[]` Token program
- `[]` System program

### 4. Cancel Listing

Removes an NFT listing from the marketplace.

**Accounts:**

- `[signer]` NFT owner/seller
- `[writable]` Listing account
- `[]` NFT mint account

### 5. Update Marketplace Fee

Updates the marketplace fee percentage (admin only).

**Accounts:**

- `[signer]` Marketplace authority
- `[writable]` Marketplace account

**Parameters:**

- `new_fee_percentage`: New fee in basis points

## Program Derived Addresses (PDAs)

### Marketplace PDA

```
seeds: ["marketplace", authority_pubkey]
```

### Listing PDA

```
seeds: ["listing", nft_mint_pubkey, seller_pubkey]
```

### Marketplace Fee PDA

```
seeds: ["fee", marketplace_pubkey]
```

## Security Features

- **Authority Verification**: Only marketplace authority can update fees
- **Signer Verification**: All critical operations require proper signatures
- **Account Ownership Validation**: Ensures accounts are owned by correct programs
- **Overflow Protection**: Safe arithmetic operations with overflow checks
- **PDA Validation**: Verifies Program Derived Addresses match expected seeds

## Building and Deployment

### Prerequisites

- Rust 1.86.0 or later
- Solana CLI tools

### Build

```bash
cd solana-program
cargo build-bpf
```

### Test

```bash
cargo test
```

### Deploy

```bash
solana program deploy target/deploy/nft_marketplace.so
```

## Integration with Frontend

This program is designed to work with the Next.js frontend marketplace application. The frontend can interact with the program using:

- `@solana/web3.js` for transaction construction
- `@solana/wallet-adapter` for wallet integration
- Program instruction builders from `instruction.rs`

## Limitations and Future Enhancements

### Current Limitations

- NFT transfer logic is simplified (production would use SPL Token program)
- No escrow mechanism for atomic swaps
- Basic fee structure (could support tiered fees)

### Potential Enhancements

- Auction functionality
- Royalty support for creators
- Batch operations
- Advanced fee structures
- Escrow-based atomic swaps
- Collection-based listings

## Error Handling

The program includes comprehensive error handling with custom error types:

- `InvalidInstruction`: Malformed instruction data
- `InvalidPrice`: Zero or invalid price values
- `InsufficientFunds`: Buyer lacks required funds
- `InvalidSeller`: Seller verification failures
- `AccountNotInitialized`: Uninitialized account access
- And more...

## License

This program is provided as-is for educational and development purposes.
