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

## 📚 API Documentation

The backend provides a comprehensive REST API. See [backend/README.md](backend/README.md) for detailed endpoint documentation.

## 🗺️ Roadmap

- [ ] Users favorite
- [ ] Price Alert and User watchlist
- [ ] Advanced analytics dashboard
- [ ] Multi-marketplace aggregation
- [ ] NFT minting tools
- [ ] Auction functionality
- [ ] Cross-chain bridge integration
