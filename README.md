# SolMint - Solana NFT Marketplace

A comprehensive NFT marketplace built on Solana with real-time indexing, advanced trading features, and marketplace fee management.

## 🚀 Features

- **Decentralized Trading**: Built on Solana for fast, low-cost transactions
- **Real-time Indexing**: Automatic blockchain data synchronization
- **Marketplace Fees**: Configurable fee structure with transparent calculations
- **Advanced Search**: Filter and search NFTs by various criteria
- **User Profiles**: Wallet-based user accounts with favorites and watchlists
- **Analytics**: Comprehensive marketplace statistics and trading data
- **Responsive Design**: Modern UI that works on all devices

## 🏗️ Architecture

```
solmint/
├── solana-program/     # Rust-based Solana smart contract
├── backend/           # Rust API server with PostgreSQL
├── marketplace/       # Next.js frontend application
└── README.md         # This file
```

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/kaicong12/solmint.git
cd solmint
```

### 2. Set Up the Solana Program

```bash
cd solana-program

# Build the program
cargo build-bpf

# Deploy to devnet (optional)
solana config set --url devnet
solana program deploy target/deploy/solana_program.so
```

### 3. Set Up the Backend

```bash
cd ../backend

# Install dependencies
cargo build

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials and configuration

# Run database migrations
sqlx migrate run

# Start the backend server
cargo run
```

### 4. Set Up the Frontend

```bash
cd ../marketplace

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your configuration

# Start the development server
npm run dev
```

## 🔧 Configuration

### Backend Configuration (.env)

```env
DATABASE_URL=postgresql://username:password@localhost/solmint
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_WS_URL=wss://api.devnet.solana.com
PROGRAM_ID=YourProgramIdHere
SERVER_HOST=127.0.0.1
SERVER_PORT=8080
RUST_LOG=info
```

### Frontend Configuration (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=YourProgramIdHere
```

## 🚀 Running the Application

### Development Mode

1. **Start the backend**:

   ```bash
   cd backend
   cargo run
   ```

2. **Start the frontend**:

   ```bash
   cd marketplace
   npm run dev
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - API Health Check: http://localhost:8080/health

### Production Mode

#### Using Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build individual services
cd backend
docker build -t solmint-backend .
docker run -p 8080:8080 solmint-backend

cd ../marketplace
docker build -t solmint-frontend .
docker run -p 3000:3000 solmint-frontend
```

#### Manual Deployment

```bash
# Backend
cd backend
cargo build --release
./target/release/backend

# Frontend
cd marketplace
npm run build
npm start
```

## 💰 Marketplace Fee System

SolMint implements a transparent and configurable marketplace fee system:

### How Fees Work

- **Fee Structure**: Fees are calculated in basis points (1 basis point = 0.01%)
- **Default Fee**: 250 basis points (2.5%)
- **Maximum Fee**: 1000 basis points (10%)
- **Fee Recipient**: Configurable marketplace authority

### Fee Examples

| Sale Price | Fee (2.5%) | Seller Receives |
| ---------- | ---------- | --------------- |
| 1 SOL      | 0.025 SOL  | 0.975 SOL       |
| 10 SOL     | 0.25 SOL   | 9.75 SOL        |
| 100 SOL    | 2.5 SOL    | 97.5 SOL        |

### Managing Fees

- **Admin Panel**: Update fees through the frontend admin interface
- **Smart Contract**: Fees are enforced at the blockchain level
- **Transparency**: All fee calculations are visible to users

## 🧪 Testing

### Backend Tests

```bash
cd backend
cargo test
```

### Frontend Tests

```bash
cd marketplace
npm test
```

### Integration Tests

```bash
# Run end-to-end tests
npm run test:e2e
```

## 📚 API Documentation

The backend provides a comprehensive REST API. See [backend/README.md](backend/README.md) for detailed endpoint documentation.

## 🗺️ Roadmap

- [ ] Advanced analytics dashboard
- [ ] Multi-marketplace aggregation
- [ ] NFT minting tools
- [ ] Auction functionality
- [ ] Cross-chain bridge integration
