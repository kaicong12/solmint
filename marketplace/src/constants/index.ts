import { NetworkConfig, SolanaNetwork } from "@/types";

// Network Configurations
export const NETWORK_CONFIGS: Record<SolanaNetwork, NetworkConfig> = {
  "mainnet-beta": {
    name: "mainnet-beta",
    rpcEndpoint: "https://api.mainnet-beta.solana.com",
    wsEndpoint: "wss://api.mainnet-beta.solana.com",
    explorerUrl: "https://explorer.solana.com",
  },
  devnet: {
    name: "devnet",
    rpcEndpoint: "https://api.devnet.solana.com",
    wsEndpoint: "wss://api.devnet.solana.com",
    explorerUrl: "https://explorer.solana.com?cluster=devnet",
  },
  testnet: {
    name: "testnet",
    rpcEndpoint: "https://api.testnet.solana.com",
    wsEndpoint: "wss://api.testnet.solana.com",
    explorerUrl: "https://explorer.solana.com?cluster=testnet",
  },
};

// Current Network Configuration
export const CURRENT_NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK ||
  "devnet") as SolanaNetwork;
export const CURRENT_RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_RPC_ENDPOINT ||
  NETWORK_CONFIGS[CURRENT_NETWORK].rpcEndpoint;

// Program IDs
export const PROGRAM_IDS = {
  TOKEN_PROGRAM: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  ASSOCIATED_TOKEN_PROGRAM: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
  TOKEN_METADATA_PROGRAM: "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
  SYSTEM_PROGRAM: "11111111111111111111111111111111",
  RENT_PROGRAM: "SysvarRent111111111111111111111111111111111",
  CLOCK_PROGRAM: "SysvarC1ock11111111111111111111111111111111",
};

// Transaction Configuration
export const TRANSACTION_CONFIG = {
  COMMITMENT: "confirmed" as const,
  PREFLIGHT_COMMITMENT: "processed" as const,
  MAX_RETRIES: 3,
  TIMEOUT: 30000, // 30 seconds
  CONFIRMATION_TIMEOUT: 60000, // 60 seconds
};

// NFT Configuration
export const NFT_CONFIG = {
  MAX_NAME_LENGTH: 32,
  MAX_SYMBOL_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  DEFAULT_ROYALTY: 500, // 5%
  MAX_ROYALTY: 10000, // 100%
  MAX_ATTRIBUTES: 20,
};

// Storage Configuration
export const STORAGE_CONFIG = {
  ARWEAVE: {
    GATEWAY: "https://arweave.net",
    TIMEOUT: 60000,
  },
  IPFS: {
    GATEWAY: "https://ipfs.io/ipfs",
    PINATA_GATEWAY: "https://gateway.pinata.cloud/ipfs",
    TIMEOUT: 30000,
  },
  NFT_STORAGE: {
    API_URL: "https://api.nft.storage",
    TIMEOUT: 30000,
  },
};

// UI Configuration
export const UI_CONFIG = {
  ITEMS_PER_PAGE: 20,
  MAX_ITEMS_PER_PAGE: 100,
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 5000,
  ANIMATION_DURATION: 200,
};

// Marketplace Configuration
export const MARKETPLACE_CONFIG = {
  PLATFORM_FEE: 250, // 2.5%
  MIN_PRICE: 0.001, // SOL
  MAX_PRICE: 1000000, // SOL
  DEFAULT_LISTING_DURATION: 7, // days
  MAX_LISTING_DURATION: 30, // days
};

// Error Messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: "Please connect your wallet first",
  INSUFFICIENT_BALANCE: "Insufficient balance for this transaction",
  TRANSACTION_FAILED: "Transaction failed. Please try again.",
  NETWORK_ERROR: "Network error. Please check your connection.",
  INVALID_ADDRESS: "Invalid Solana address",
  FILE_TOO_LARGE: "File size exceeds maximum limit",
  UNSUPPORTED_FILE_TYPE: "Unsupported file type",
  METADATA_UPLOAD_FAILED: "Failed to upload metadata",
  NFT_NOT_FOUND: "NFT not found",
  UNAUTHORIZED: "You are not authorized to perform this action",
  RATE_LIMITED: "Too many requests. Please try again later.",
};

// Success Messages
export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: "Wallet connected successfully",
  WALLET_DISCONNECTED: "Wallet disconnected",
  NFT_MINTED: "NFT minted successfully",
  NFT_TRANSFERRED: "NFT transferred successfully",
  NFT_LISTED: "NFT listed for sale",
  NFT_PURCHASED: "NFT purchased successfully",
  LISTING_CANCELLED: "Listing cancelled",
  METADATA_UPLOADED: "Metadata uploaded successfully",
};

// Backend API Configuration
export const BACKEND_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080",
  API_VERSION: "v1",
};

// API Endpoints
export const API_ENDPOINTS = {
  // Health
  HEALTH: "/health",

  // NFTs
  NFTS: "/api/v1/nfts",
  NFT_DETAILS: (mint: string) => `/api/v1/nfts/${mint}`,
  NFT_ACTIVITIES: (mint: string) => `/api/v1/nfts/${mint}/activities`,

  // Collections
  COLLECTIONS: "/api/v1/collections",
  COLLECTION_DETAILS: (id: string) => `/api/v1/collections/${id}`,
  COLLECTION_NFTS: (id: string) => `/api/v1/collections/${id}/nfts`,

  // Listings
  LISTINGS: "/api/v1/listings",
  LISTING_DETAILS: (id: string) => `/api/v1/listings/${id}`,

  // Sales
  SALES: "/api/v1/sales",

  // Users
  USER_PROFILE: (wallet: string) => `/api/v1/users/${wallet}`,
  USER_FAVORITES: (wallet: string) => `/api/v1/users/${wallet}/favorites`,
  USER_FAVORITE_NFT: (wallet: string, mint: string) =>
    `/api/v1/users/${wallet}/favorites/${mint}`,

  // Statistics
  STATS: "/api/v1/stats",
  STATS_DAILY: "/api/v1/stats/daily",

  // Search
  SEARCH: "/api/v1/search",

  // Legacy endpoints (keeping for backward compatibility)
  METADATA: "/api/metadata",
  UPLOAD: "/api/upload",
  WALLET: "/api/wallet",
  TRANSACTIONS: "/api/transactions",
};

// Local Storage Keys
export const STORAGE_KEYS = {
  WALLET_PREFERENCE: "solmint_wallet_preference",
  THEME: "solmint_theme",
  LANGUAGE: "solmint_language",
  RECENT_SEARCHES: "solmint_recent_searches",
  FAVORITES: "solmint_favorites",
};

// Validation Rules
export const VALIDATION_RULES = {
  WALLET_ADDRESS: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  TRANSACTION_SIGNATURE: /^[1-9A-HJ-NP-Za-km-z]{87,88}$/,
  URL: /^https?:\/\/.+/,
  POSITIVE_NUMBER: /^\d*\.?\d+$/,
  INTEGER: /^\d+$/,
};

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_COLLECTIONS: true,
  ENABLE_MARKETPLACE: true,
  ENABLE_BATCH_OPERATIONS: true,
  ENABLE_ANALYTICS: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_DARK_MODE: true,
};

// Rate Limiting
export const RATE_LIMITS = {
  MINT_PER_HOUR: 10,
  TRANSFER_PER_HOUR: 50,
  LIST_PER_HOUR: 20,
  UPLOAD_PER_HOUR: 100,
  API_REQUESTS_PER_MINUTE: 60,
};
