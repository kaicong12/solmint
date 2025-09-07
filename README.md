# NFT Marketplace - Solana Native Implementation

A complete NFT marketplace built with native Rust Solana SDK and Next.js frontend, enabling users to list, buy, and manage NFT sales with configurable marketplace fees.

## 🏗️ Architecture

### Backend (Solana Program)

- **Language**: Rust with native Solana SDK v2.2.0
- **Architecture**: Program Derived Addresses (PDAs) for deterministic account management
- **Serialization**: Borsh for efficient data encoding/decoding
- **Error Handling**: Custom error types with detailed error messages

### Frontend

- **Framework**: Next.js 14 with TypeScript
- **Wallet Integration**: Solana Wallet Adapter
- **UI**: React components with Tailwind CSS
- **State Management**: React hooks for blockchain interactions

## 📁 Project Structure

```
├── solana-program/           # Rust Solana program
│   ├── src/
│   │   ├── lib.rs           # Program entry point
│   │   ├── processor.rs     # Core business logic
│   │   ├── instruction.rs   # Instruction definitions
│   │   ├── state.rs         # Account data structures
│   │   └── error.rs         # Custom error types
│   └── Cargo.toml           # Rust dependencies
├── marketplace/             # Next.js frontend
│   ├── src/
│   │   ├── lib/solana/      # Solana integration utilities
│   │   ├── hooks/           # React hooks
│   │   ├── components/      # UI components
│   │   └── app/             # Next.js app router
│   └── package.json         # Node.js dependencies
└── README.md               # This file
```

## 🚀 Features

### Core Marketplace Operations

- **Initialize Marketplace**: Set up marketplace with configurable fee percentage
- **List NFT**: List NFTs for sale with custom pricing
- **Buy NFT**: Purchase listed NFTs with automatic fee calculation
- **Cancel Listing**: Remove NFT listings from the marketplace
- **Admin Functions**: Update marketplace fees (authority only)

### Advanced Features

- **Fee Management**: Basis points system for precise fee calculation
- **Volume Tracking**: Track total marketplace volume and sales count
- **PDA-based Architecture**: Deterministic account addressing for scalability
- **Error Handling**: Comprehensive error types for better UX
- **Wallet Integration**: Seamless connection with Solana wallets

## 🛠️ Setup & Installation

### Prerequisites

- Node.js 18+ and npm/yarn
- Rust 1.70+ with Cargo
- Solana CLI tools
- A Solana wallet (Phantom, Solflare, etc.)

### Backend Setup (Solana Program)

1. **Navigate to the program directory**:

   ```bash
   cd solana-program
   ```

2. **Install dependencies**:

   ```bash
   cargo build
   ```

3. **Build the program**:

   ```bash
   cargo build-bpf
   ```

4. **Deploy to devnet** (optional):
   ```bash
   solana program deploy target/deploy/solana_program.so
   ```

### Frontend Setup

1. **Navigate to the frontend directory**:

   ```bash
   cd marketplace
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env.local` file:

   ```env
   NEXT_PUBLIC_SOLANA_NETWORK=devnet
   NEXT_PUBLIC_PROGRAM_ID=your_deployed_program_id
   ```

4. **Run the development server**:

   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to `http://localhost:3000`

## 📖 Usage Guide

### For Users

1. **Connect Wallet**: Click the wallet button to connect your Solana wallet
2. **Initialize Marketplace**: Set up the marketplace with your desired fee percentage
3. **List NFT**: Enter your NFT mint address and desired price to list for sale
4. **Buy NFT**: Browse listings and purchase NFTs directly
5. **Manage Listings**: Cancel your active listings if needed

### For Developers

#### Program Interaction

```typescript
import { useMarketplace } from "@/hooks/useMarketplace";

function MyComponent() {
  const {
    initializeMarketplace,
    listNft,
    buyNft,
    cancelListing,
    updateMarketplaceFee,
  } = useMarketplace();

  // Initialize marketplace
  await initializeMarketplace(250); // 2.5% fee

  // List an NFT
  await listNft("NFT_MINT_ADDRESS", 1000000000); // 1 SOL

  // Buy an NFT
  await buyNft("NFT_MINT_ADDRESS");
}
```

#### Custom Instructions

```typescript
import { createListNftInstruction } from "@/lib/solana/program";

const instruction = createListNftInstruction(programId, nftMint, seller, price);
```

## 🏛️ Program Architecture

### Account Structure

#### Marketplace Account

```rust
pub struct Marketplace {
    pub is_initialized: bool,    // Initialization flag
    pub authority: Pubkey,       // Marketplace authority
    pub fee_percentage: u16,     // Fee in basis points (100 = 1%)
    pub fee_recipient: Pubkey,   // Fee recipient address
    pub total_volume: u64,       // Total trading volume
    pub total_sales: u64,        // Total number of sales
}
```

#### Listing Account

```rust
pub struct Listing {
    pub is_active: bool,         // Listing status
    pub seller: Pubkey,          // NFT seller
    pub nft_mint: Pubkey,        // NFT mint address
    pub price: u64,              // Price in lamports
    pub created_at: i64,         // Creation timestamp
}
```

### Program Derived Addresses (PDAs)

- **Marketplace PDA**: `["marketplace", authority.key()]`
- **Listing PDA**: `["listing", nft_mint.key()]`

## 🔧 Configuration

### Marketplace Settings

- **Fee Percentage**: Configurable marketplace fee (in basis points)
- **Fee Recipient**: Address that receives marketplace fees
- **Authority**: Account with admin privileges

### Network Configuration

- **Devnet**: For development and testing
- **Mainnet**: For production deployment
- **Localnet**: For local development

## 🧪 Testing

### Unit Tests

```bash
cd solana-program
cargo test
```

### Integration Tests

```bash
cd marketplace
npm test
```

### Manual Testing

1. Deploy program to devnet
2. Run frontend locally
3. Connect wallet and test all operations
4. Verify transactions on Solana Explorer

## 🚨 Error Handling

The program includes comprehensive error handling:

- `InvalidInstruction`: Malformed instruction data
- `NotRentExempt`: Account doesn't meet rent exemption
- `InvalidPrice`: Price validation failed
- `InsufficientFunds`: Not enough funds for transaction
- `ListingNotFound`: Listing doesn't exist
- `ListingNotActive`: Listing is not active
- `UnauthorizedSeller`: Seller authorization failed
- `InvalidNftMint`: NFT mint validation failed
- `MarketplaceNotInitialized`: Marketplace not set up
- `Unauthorized`: Insufficient permissions

## 🔐 Security Considerations

- **PDA Verification**: All PDAs are properly verified
- **Authority Checks**: Admin functions require proper authorization
- **Account Validation**: All accounts are validated before operations
- **Overflow Protection**: Safe math operations prevent overflows
- **Rent Exemption**: All accounts maintain rent exemption

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For questions and support:

- Create an issue in the repository
- Check existing documentation
- Review the code examples

## 🔗 Resources

- [Solana Documentation](https://docs.solana.com/)
- [Solana Program Library](https://spl.solana.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)
