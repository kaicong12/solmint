# SolMint Backend

A production-ready Rust backend for the SolMint NFT marketplace built with Axum, PostgreSQL, Redis, and Solana integration.

## Features

- **High Performance**: Built with Rust and Axum for maximum performance
- **Blockchain Integration**: Real-time Solana blockchain indexing
- **Caching**: Redis-based caching for fast API responses
- **Database**: PostgreSQL with optimized queries and indexes
- **Real-time Data**: Automatic syncing of marketplace transactions
- **Search**: Full-text search across NFTs, collections, and users
- **Analytics**: Comprehensive marketplace statistics and metrics
- **User Management**: User profiles, favorites, and watchlists
- **Production Ready**: Error handling, logging, rate limiting, and monitoring

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Next.js)     │◄──►│   (Rust/Axum)   │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                         │
                              ▼                         ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Redis Cache   │    │ Solana Indexer  │
                       └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │ Solana Network  │
                                              └─────────────────┘
```

## Quick Start

### Prerequisites

- Rust 1.70+
- PostgreSQL 14+
- Redis 6+
- Solana CLI (optional, for development)

### Installation

1. **Clone and setup**:

```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

2. **Install dependencies**:

```bash
cargo build
```

3. **Setup database**:

```bash
# Create database
createdb solmint

# Run migrations (handled automatically on startup)
cargo run
```

4. **Start services**:

```bash
# Start Redis
redis-server

# Start PostgreSQL
pg_ctl start

# Start the backend
cargo run
```

The API will be available at `http://localhost:8080`

## API Endpoints

### Health Check

- `GET /health` - Service health status

### NFTs

- `GET /api/v1/nfts` - List NFTs with filtering and pagination
- `GET /api/v1/nfts/:mint` - Get specific NFT details
- `GET /api/v1/nfts/:mint/activities` - Get NFT activity history

### Collections

- `GET /api/v1/collections` - List collections
- `GET /api/v1/collections/:id` - Get collection details and stats
- `GET /api/v1/collections/:id/nfts` - Get NFTs in collection

### Listings

- `GET /api/v1/listings` - List active marketplace listings
- `GET /api/v1/listings/:id` - Get specific listing details

### Sales

- `GET /api/v1/sales` - List recent sales with filtering

### Users

- `GET /api/v1/users/:wallet` - Get user profile
- `POST /api/v1/users/:wallet` - Create/update user profile
- `GET /api/v1/users/:wallet/favorites` - Get user favorites
- `POST /api/v1/users/:wallet/favorites` - Add favorite NFT
- `DELETE /api/v1/users/:wallet/favorites/:mint` - Remove favorite

### Statistics

- `GET /api/v1/stats` - Global marketplace statistics
- `GET /api/v1/stats/daily` - Daily statistics with history

### Search

- `GET /api/v1/search?q=query` - Search across NFTs, collections, users

## Configuration

### Environment Variables

| Variable                   | Description                  | Default                               |
| -------------------------- | ---------------------------- | ------------------------------------- |
| `DATABASE_URL`             | PostgreSQL connection string | `postgresql://localhost/solmint`      |
| `REDIS_URL`                | Redis connection string      | `redis://localhost:6379`              |
| `SOLANA_RPC_URL`           | Solana RPC endpoint          | `https://api.mainnet-beta.solana.com` |
| `MARKETPLACE_PROGRAM_ID`   | Your marketplace program ID  | Required                              |
| `PORT`                     | Server port                  | `8080`                                |
| `JWT_SECRET`               | JWT signing secret           | Required for production               |
| `INDEXER_INTERVAL_SECONDS` | Blockchain sync interval     | `10`                                  |
| `MAX_CONCURRENT_REQUESTS`  | Rate limiting                | `100`                                 |
| `CACHE_TTL_SECONDS`        | Default cache TTL            | `300`                                 |

## Database Schema

The backend uses a comprehensive PostgreSQL schema with the following main tables:

- **users** - User profiles and preferences
- **collections** - NFT collections metadata
- **nfts** - Individual NFT records with metadata
- **listings** - Active marketplace listings
- **sales** - Historical sales data
- **activities** - All marketplace activities
- **user_favorites** - User favorite NFTs
- **marketplace_stats** - Daily aggregated statistics

## Blockchain Indexer

The indexer continuously monitors the Solana blockchain for marketplace transactions:

- **Real-time Sync**: Processes new blocks as they're confirmed
- **Transaction Parsing**: Extracts marketplace-specific data
- **Database Updates**: Updates NFT ownership, listings, and sales
- **Activity Tracking**: Records all marketplace activities
- **Error Recovery**: Handles RPC failures and network issues

## Caching Strategy

Redis caching is used for:

- **API Responses**: Frequently accessed data (NFTs, collections, stats)
- **Search Results**: Cached search queries
- **User Sessions**: Authentication and rate limiting
- **Computed Data**: Expensive calculations and aggregations

Cache keys follow a structured pattern:

- `nft:{mint_address}`
- `collection:{collection_id}`
- `user:{wallet_address}`
- `listings:{page}:{limit}:{filters}`

## Performance Optimizations

- **Database Indexes**: Optimized for common query patterns
- **Connection Pooling**: Efficient database connection management
- **Async Processing**: Non-blocking I/O for all operations
- **Batch Operations**: Efficient bulk data processing
- **Query Optimization**: Minimized N+1 queries and joins

## Development

### Running Tests

```bash
cargo test
```

### Code Formatting

```bash
cargo fmt
```

### Linting

```bash
cargo clippy
```

### Database Migrations

Migrations are automatically applied on startup. Manual migration files are in `/migrations/`.

## Production Deployment

### Docker

```dockerfile
FROM rust:1.70 as builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/solmint-backend /usr/local/bin/
EXPOSE 8080
CMD ["solmint-backend"]
```

### Environment Setup

- Use environment-specific `.env` files
- Configure proper database connection pooling
- Set up Redis clustering for high availability
- Configure proper logging levels
- Set up monitoring and alerting

### Monitoring

The backend exposes metrics for:

- Request latency and throughput
- Database connection pool status
- Cache hit/miss rates
- Indexer sync status
- Error rates by endpoint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run `cargo test` and `cargo clippy`
6. Submit a pull request

## License

MIT License - see LICENSE file for details.
