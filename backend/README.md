# SolMint Backend API

A high-performance Rust-based API server for the SolMint NFT marketplace, built with Axum and PostgreSQL.

## 🏗️ Architecture

- **Framework**: Axum (async web framework)
- **Database**: PostgreSQL with SQLx
- **Blockchain**: Solana RPC integration
- **Indexing**: Real-time blockchain data synchronization
- **Caching**: In-memory caching for performance

## 🚀 Quick Start

### Prerequisites

- Rust (latest stable)
- PostgreSQL (v14+)
- Solana CLI tools

### Installation

```bash
# Clone and navigate to backend
cd backend

# Install dependencies
cargo build

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run migrations
sqlx migrate run

# Start the server
cargo run
```

## 🔧 Configuration

### Environment Variables (.env)

```env
# Database
DATABASE_URL=postgresql://username:password@localhost/solmint

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_WS_URL=wss://api.devnet.solana.com
PROGRAM_ID=YourProgramIdHere

# Server Configuration
SERVER_HOST=127.0.0.1
SERVER_PORT=8080
RUST_LOG=info

# Optional: Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=100
RATE_LIMIT_BURST=20
```

## 📡 API Endpoints

### Health Check

#### GET /health

Check API server health status.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "database": "connected",
  "solana_rpc": "connected"
}
```

---

### Collections

#### GET /collections

List all NFT collections with optional filtering.

**Query Parameters:**

- `creator_address` (optional): Filter by creator wallet address
- `verified` (optional): Filter by verification status (true/false)
- `sort_by` (optional): Sort field ("name", "floor_price", "total_volume", "created_at")
- `sort_order` (optional): Sort direction ("asc", "desc")
- `page` (optional): Page number (default: 0)
- `limit` (optional): Items per page (default: 20, max: 100)

**Example Request:**

```bash
GET /collections?verified=true&sort_by=total_volume&sort_order=desc&limit=10
```

**Response:**

```json
{
  "collections": [
    {
      "id": "uuid",
      "name": "Cool Cats",
      "symbol": "COOL",
      "description": "A collection of cool cats",
      "image_url": "https://example.com/image.png",
      "banner_url": "https://example.com/banner.png",
      "creator_address": "ABC123...",
      "verified": true,
      "floor_price": 1500000000,
      "total_volume": 50000000000,
      "total_supply": 10000,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### GET /collections/{id}

Get detailed information about a specific collection.

**Response:**

```json
{
  "collection": {
    "id": "uuid",
    "name": "Cool Cats",
    "symbol": "COOL",
    "description": "A collection of cool cats",
    "image_url": "https://example.com/image.png",
    "banner_url": "https://example.com/banner.png",
    "creator_address": "ABC123...",
    "verified": true,
    "floor_price": 1500000000,
    "total_volume": 50000000000,
    "total_supply": 10000,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### NFTs

#### GET /nfts

List NFTs with advanced filtering and search capabilities.

**Query Parameters:**

- `collection_id` (optional): Filter by collection UUID
- `owner_address` (optional): Filter by current owner
- `creator_address` (optional): Filter by creator
- `min_price` (optional): Minimum listing price in lamports
- `max_price` (optional): Maximum listing price in lamports
- `search` (optional): Search in name and description
- `attributes` (optional): JSON filter for NFT attributes
- `sort_by` (optional): Sort field ("name", "price", "rarity_rank", "created_at")
- `sort_order` (optional): Sort direction ("asc", "desc")
- `page` (optional): Page number (default: 0)
- `limit` (optional): Items per page (default: 20, max: 100)

**Example Request:**

```bash
GET /nfts?collection_id=uuid&min_price=1000000000&sort_by=rarity_rank&limit=50
```

**Response:**

```json
{
  "nfts": [
    {
      "id": "uuid",
      "mint_address": "DEF456...",
      "collection_id": "uuid",
      "name": "Cool Cat #1234",
      "description": "A very cool cat",
      "image_url": "https://example.com/nft.png",
      "animation_url": null,
      "external_url": "https://coolcats.com/1234",
      "attributes": [
        {
          "trait_type": "Background",
          "value": "Blue"
        },
        {
          "trait_type": "Eyes",
          "value": "Laser"
        }
      ],
      "creator_address": "ABC123...",
      "current_owner": "GHI789...",
      "is_compressed": false,
      "rarity_rank": 42,
      "rarity_score": 85.5,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### GET /nfts/{mint_address}

Get detailed information about a specific NFT.

**Response:**

```json
{
  "nft": {
    "id": "uuid",
    "mint_address": "DEF456...",
    "collection_id": "uuid",
    "name": "Cool Cat #1234",
    "description": "A very cool cat",
    "image_url": "https://example.com/nft.png",
    "animation_url": null,
    "external_url": "https://coolcats.com/1234",
    "attributes": [...],
    "creator_address": "ABC123...",
    "current_owner": "GHI789...",
    "is_compressed": false,
    "rarity_rank": 42,
    "rarity_score": 85.5,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### Listings

#### GET /listings

List active marketplace listings with filtering options.

**Query Parameters:**

- `nft_mint` (optional): Filter by NFT mint address
- `seller_address` (optional): Filter by seller wallet
- `marketplace_address` (optional): Filter by marketplace
- `status` (optional): Filter by status ("active", "sold", "cancelled")
- `min_price` (optional): Minimum price in lamports
- `max_price` (optional): Maximum price in lamports
- `sort_by` (optional): Sort field ("price", "created_at")
- `sort_order` (optional): Sort direction ("asc", "desc")
- `page` (optional): Page number (default: 0)
- `limit` (optional): Items per page (default: 20, max: 100)

**Example Request:**

```bash
GET /listings?status=active&min_price=500000000&sort_by=price&sort_order=asc
```

**Response:**

```json
{
  "listings": [
    {
      "id": "uuid",
      "listing_address": "JKL012...",
      "nft_mint": "DEF456...",
      "seller_address": "GHI789...",
      "price": 2000000000,
      "marketplace_address": "MNO345...",
      "status": "active",
      "transaction_signature": "PQR678...",
      "block_time": "2024-01-15T10:00:00Z",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

### Sales

#### GET /sales

List completed sales with comprehensive filtering.

**Query Parameters:**

- `nft_mint` (optional): Filter by NFT mint address
- `seller_address` (optional): Filter by seller wallet
- `buyer_address` (optional): Filter by buyer wallet
- `min_price` (optional): Minimum sale price in lamports
- `max_price` (optional): Maximum sale price in lamports
- `from_date` (optional): Start date (ISO 8601 format)
- `to_date` (optional): End date (ISO 8601 format)
- `sort_by` (optional): Sort field ("price", "block_time")
- `sort_order` (optional): Sort direction ("asc", "desc")
- `page` (optional): Page number (default: 0)
- `limit` (optional): Items per page (default: 20, max: 100)

**Example Request:**

```bash
GET /sales?from_date=2024-01-01T00:00:00Z&to_date=2024-01-15T23:59:59Z&sort_by=price&sort_order=desc
```

**Response:**

```json
{
  "sales": [
    {
      "id": "uuid",
      "nft_mint": "DEF456...",
      "seller_address": "GHI789...",
      "buyer_address": "STU901...",
      "price": 5000000000,
      "marketplace_fee": 125000000,
      "transaction_signature": "VWX234...",
      "block_time": "2024-01-15T09:30:00Z",
      "created_at": "2024-01-15T09:30:00Z"
    }
  ]
}
```

---

### Users

#### GET /users/{wallet_address}

Get user profile information.

**Response:**

```json
{
  "user": {
    "id": "uuid",
    "wallet_address": "ABC123...",
    "username": "cooltrader",
    "email": "user@example.com",
    "bio": "NFT enthusiast and collector",
    "avatar_url": "https://example.com/avatar.png",
    "twitter_handle": "cooltrader",
    "discord_handle": "cooltrader#1234",
    "verified": false,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

#### POST /users/{wallet_address}/favorites

Add an NFT to user's favorites.

**Request Body:**

```json
{
  "nft_mint": "DEF456..."
}
```

**Response:**

```json
{
  "message": "NFT added to favorites",
  "favorite_id": "uuid"
}
```

#### DELETE /users/{wallet_address}/favorites/{nft_mint}

Remove an NFT from user's favorites.

**Response:**

```json
{
  "message": "NFT removed from favorites"
}
```

#### GET /users/{wallet_address}/favorites

Get user's favorite NFTs.

**Response:**

```json
{
  "favorites": [
    {
      "id": "uuid",
      "nft_mint": "DEF456...",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### Search

#### GET /search

Global search across NFTs, collections, and users.

**Query Parameters:**

- `q` (required): Search query string
- `type` (optional): Search type ("nfts", "collections", "users", "all")
- `limit` (optional): Items per page (default: 20, max: 100)

**Example Request:**

```bash
GET /search?q=cool%20cats&type=all&limit=10
```

**Response:**

```json
{
  "results": {
    "nfts": [...],
    "collections": [...],
    "users": [...]
  },
  "total_results": 42
}
```

---

### Statistics

#### GET /stats/marketplace

Get overall marketplace statistics.

**Response:**

```json
{
  "stats": {
    "total_volume": 1000000000000,
    "total_sales": 50000,
    "total_nfts": 100000,
    "total_collections": 500,
    "total_users": 10000,
    "volume_24h": 50000000000,
    "sales_24h": 200,
    "average_price": 2000000000,
    "floor_price": 500000000,
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

#### GET /stats/collections/{id}

Get statistics for a specific collection.

**Response:**

```json
{
  "stats": {
    "collection_id": "uuid",
    "floor_price": 1500000000,
    "total_volume": 50000000000,
    "total_sales": 5000,
    "volume_24h": 5000000000,
    "sales_24h": 25,
    "average_price": 10000000000,
    "unique_holders": 3500,
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

---

## 💰 Marketplace Fee System

### Fee Calculation

The marketplace implements a transparent fee system:

- **Fee Structure**: Basis points (1 basis point = 0.01%)
- **Default Fee**: 250 basis points (2.5%)
- **Maximum Fee**: 1000 basis points (10%)

### Fee Examples in API Responses

All sale records include both the total price and marketplace fee:

```json
{
  "price": 5000000000, // 5 SOL in lamports
  "marketplace_fee": 125000000, // 0.125 SOL fee (2.5%)
  "seller_proceeds": 4875000000 // 4.875 SOL to seller
}
```

### Fee Calculation Formula

```rust
// In the Solana program
let fee = (price * fee_percentage) / 10000;
let seller_proceeds = price - fee;
```

---

## 🔄 Real-time Indexing

The backend includes a blockchain indexer that:

- **Monitors**: Solana blockchain for marketplace transactions
- **Indexes**: NFT listings, sales, and transfers
- **Updates**: Database in real-time
- **Handles**: Chain reorganizations and missed blocks

### Indexer Status

Check indexer health via the health endpoint:

```json
{
  "status": "healthy",
  "indexer": {
    "last_processed_slot": 123456789,
    "last_processed_signature": "ABC123...",
    "blocks_behind": 2,
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

---

## 🚀 Performance

### Response Times

- **Health Check**: <10ms
- **Simple Queries**: <50ms
- **Complex Queries**: <200ms
- **Search**: <100ms

### Rate Limiting

- **Default**: 100 requests/minute per IP
- **Burst**: 20 requests in 10 seconds
- **Headers**: Rate limit info in response headers

### Caching

- **In-memory**: Frequently accessed data
- **TTL**: 5 minutes for most cached data
- **Invalidation**: Automatic on data updates

---

## 🔒 Security

### Authentication

- **Wallet-based**: Solana wallet signature verification
- **JWT Tokens**: For session management
- **Rate Limiting**: DDoS protection

### Data Validation

- **Input Sanitization**: All user inputs validated
- **SQL Injection**: Protected via SQLx parameterized queries
- **CORS**: Configurable cross-origin policies

---

## 🧪 Testing

### Run Tests

```bash
# Unit tests
cargo test

# Integration tests
cargo test --test integration

# With coverage
cargo tarpaulin --out html
```

### Test Database

```bash
# Set up test database
createdb solmint_test
DATABASE_URL=postgresql://localhost/solmint_test sqlx migrate run

# Run tests with test database
TEST_DATABASE_URL=postgresql://localhost/solmint_test cargo test
```

---

## 📊 Monitoring

### Metrics

- **Request Count**: Total API requests
- **Response Times**: P50, P95, P99 percentiles
- **Error Rates**: 4xx and 5xx responses
- **Database**: Connection pool usage

### Logging

```bash
# Set log level
RUST_LOG=debug cargo run

# Structured logging
RUST_LOG=solmint_backend=info,sqlx=warn cargo run
```

---

## 🔧 Development

### Database Migrations

```bash
# Create new migration
sqlx migrate add create_new_table

# Run migrations
sqlx migrate run

# Revert last migration
sqlx migrate revert
```

### Code Generation

```bash
# Generate SQLx query metadata
cargo sqlx prepare

# Update database schema
sqlx migrate run
cargo sqlx prepare
```

---

## 🚀 Deployment

### Docker

```bash
# Build image
docker build -t solmint-backend .

# Run container
docker run -p 8080:8080 --env-file .env solmint-backend
```

### Production Configuration

```env
# Production settings
RUST_LOG=info
DATABASE_URL=postgresql://prod_user:password@db.example.com/solmint
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

---

## 📝 Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid wallet address format",
    "details": {
      "field": "wallet_address",
      "provided": "invalid_address"
    }
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Invalid input data
- `NOT_FOUND`: Resource not found
- `DATABASE_ERROR`: Database operation failed
- `BLOCKCHAIN_ERROR`: Solana RPC error
- `RATE_LIMITED`: Too many requests

---

Built with ❤️ using Rust and Axum
