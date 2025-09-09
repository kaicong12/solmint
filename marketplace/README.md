# SolMint Frontend

A modern Next.js frontend for the SolMint NFT marketplace built with React, TypeScript, and Tailwind CSS.

## Features

- **Wallet Integration**: Support for multiple Solana wallets
- **Backend API Integration**: Full integration with the Rust backend API
- **Real-time Data**: Live marketplace statistics and NFT listings
- **User Management**: User profiles, favorites, and activity tracking
- **Search & Filtering**: Advanced search and filtering capabilities
- **Responsive Design**: Mobile-first responsive design
- **Type Safety**: Full TypeScript support with comprehensive type definitions

## Backend Integration

The frontend is fully integrated with the SolMint backend API, providing:

### API Endpoints Integration

- **Health Check**: `/health` - Backend service status
- **NFTs**: `/api/v1/nfts` - List and manage NFTs
- **Collections**: `/api/v1/collections` - Browse NFT collections
- **Listings**: `/api/v1/listings` - Active marketplace listings
- **Sales**: `/api/v1/sales` - Historical sales data
- **Users**: `/api/v1/users` - User profiles and favorites
- **Statistics**: `/api/v1/stats` - Marketplace analytics
- **Search**: `/api/v1/search` - Global search functionality

### Key Features

1. **Real-time Marketplace Data**

   - Live NFT listings from the backend
   - Real-time marketplace statistics
   - User favorites and profiles

2. **Comprehensive Error Handling**

   - Backend health monitoring
   - Graceful fallbacks when backend is unavailable
   - User-friendly error messages

3. **Optimized Performance**
   - Efficient API caching
   - Pagination support
   - Lazy loading of images

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Running SolMint backend (see backend/README.md)

### Installation

1. **Clone and install dependencies**:

```bash
cd marketplace
npm install
```

2. **Environment Setup**:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Solana Network Configuration
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com

# Backend API Configuration
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080

# Marketplace Program Configuration
NEXT_PUBLIC_MARKETPLACE_PROGRAM_ID=your_marketplace_program_id_here
```

3. **Start the development server**:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Backend Setup

Make sure the SolMint backend is running before starting the frontend:

1. **Start the backend services**:

```bash
cd ../backend
# Follow backend/README.md for setup instructions
cargo run
```

2. **Verify backend health**:

```bash
curl http://localhost:8080/health
```

## Project Structure

```
marketplace/
├── src/
│   ├── app/                 # Next.js app router
│   ├── components/          # React components
│   │   ├── marketplace/     # Marketplace-specific components
│   │   └── wallet/          # Wallet integration components
│   ├── hooks/               # Custom React hooks
│   │   ├── useBackendApi.ts # Backend API integration hook
│   │   ├── useMarketplace.ts# Blockchain marketplace hook
│   │   └── useWallet.ts     # Wallet connection hook
│   ├── lib/                 # Utility libraries
│   │   ├── api/             # API client and utilities
│   │   └── solana/          # Solana blockchain utilities
│   ├── types/               # TypeScript type definitions
│   └── constants/           # Application constants
├── public/                  # Static assets
└── package.json
```

## API Integration Details

### Backend API Client

The `useBackendApi` hook provides comprehensive integration with the backend:

```typescript
const {
  // Data
  listings,
  marketplaceStats,
  userProfile,
  userFavorites,

  // Loading states
  loading,
  error,

  // Functions
  loadListings,
  loadMarketplaceStats,
  addToFavorites,
  removeFromFavorites,
  searchMarketplace,
} = useBackendApi();
```

### Key Components

1. **MarketplaceDashboard**: Main marketplace interface

   - Displays live NFT listings from backend
   - Shows real-time marketplace statistics
   - Integrates user favorites functionality
   - Provides search and filtering

2. **API Client**: Centralized API communication
   - Type-safe API calls
   - Error handling and retry logic
   - Automatic request/response transformation

### Data Flow

1. **Initial Load**:

   - Check backend health status
   - Load marketplace statistics
   - Fetch active NFT listings
   - Load user profile and favorites (if connected)

2. **User Interactions**:

   - Search and filter listings
   - Add/remove favorites
   - View NFT details and activities
   - Browse collections

3. **Real-time Updates**:
   - Automatic data refresh
   - Live marketplace statistics
   - Updated user preferences

## Configuration

### Environment Variables

| Variable                             | Description                                  | Default                 |
| ------------------------------------ | -------------------------------------------- | ----------------------- |
| `NEXT_PUBLIC_SOLANA_NETWORK`         | Solana network (mainnet-beta/devnet/testnet) | `devnet`                |
| `NEXT_PUBLIC_RPC_ENDPOINT`           | Solana RPC endpoint                          | Network default         |
| `NEXT_PUBLIC_BACKEND_URL`            | Backend API base URL                         | `http://localhost:8080` |
| `NEXT_PUBLIC_MARKETPLACE_PROGRAM_ID` | Marketplace program ID                       | Required                |

### API Configuration

The backend API configuration is centralized in `src/constants/index.ts`:

```typescript
export const BACKEND_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080",
  API_VERSION: "v1",
};
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

### Code Style

- **TypeScript**: Strict type checking enabled
- **ESLint**: Configured with Next.js and React rules
- **Prettier**: Automatic code formatting
- **Tailwind CSS**: Utility-first CSS framework

## Backend API Endpoints

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

## Troubleshooting

### Backend Connection Issues

1. **Check backend health**:

```bash
curl http://localhost:8080/health
```

2. **Verify environment variables**:

```bash
echo $NEXT_PUBLIC_BACKEND_URL
```

3. **Check browser console** for API errors

### Common Issues

1. **CORS Errors**: Ensure backend CORS is configured for frontend URL
2. **Network Errors**: Verify backend is running and accessible
3. **Type Errors**: Ensure backend API responses match frontend types

## Production Deployment

### Environment Setup

1. **Configure production environment**:

```env
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_BACKEND_URL=https://your-backend-api.com
NEXT_PUBLIC_MARKETPLACE_PROGRAM_ID=your_production_program_id
```

2. **Build and deploy**:

```bash
npm run build
npm run start
```

### Deployment Checklist

- [ ] Backend API is deployed and accessible
- [ ] Environment variables are configured
- [ ] CORS is properly configured on backend
- [ ] SSL certificates are in place
- [ ] Monitoring and logging are set up

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run `npm run lint` and `npm run type-check`
6. Submit a pull request

## License

MIT License - see LICENSE file for details.
