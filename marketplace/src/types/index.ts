import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { WalletAdapter } from "@solana/wallet-adapter-base";

// Wallet Types
export interface WalletContextState {
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  disconnecting: boolean;
  wallet: WalletAdapter | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: <T extends Transaction | VersionedTransaction>(
    transaction: T
  ) => Promise<T>;
  signAllTransactions: <T extends Transaction | VersionedTransaction>(
    transactions: T[]
  ) => Promise<T[]>;
}

// NFT Types
export interface NFTMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: NFTAttribute[];
  properties?: {
    files?: Array<{
      uri: string;
      type: string;
    }>;
    category?: string;
    creators?: Array<{
      address: string;
      share: number;
      verified?: boolean;
    }>;
  };
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

export interface NFT {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes: NFTAttribute[];
  owner: string;
  collection?: string;
  creators: Creator[];
  royalty: number;
  verified: boolean;
  frozen: boolean;
  burned: boolean;
  metadata_uri: string;
  created_at: string;
  updated_at: string;
}

export interface Creator {
  address: string;
  share: number;
  verified: boolean;
}

// Collection Types
export interface Collection {
  address: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  verified: boolean;
  size: number;
  floor_price?: number;
  volume_24h?: number;
  creators: Creator[];
  created_at: string;
}

// Marketplace Types
export interface Listing {
  id: string;
  nft_mint: string;
  seller: string;
  price: number;
  currency: "SOL" | "USDC";
  status: "active" | "sold" | "cancelled";
  created_at: string;
  expires_at?: string;
}

export interface Sale {
  id: string;
  nft_mint: string;
  seller: string;
  buyer: string;
  price: number;
  currency: "SOL" | "USDC";
  transaction_signature: string;
  created_at: string;
}

// Transaction Types
export interface TransactionResult {
  success: boolean;
  signature?: string;
  error?: string;
}

export interface PendingTransaction {
  id: string;
  type: "mint" | "transfer" | "list" | "buy" | "cancel";
  status: "pending" | "confirmed" | "failed";
  signature?: string;
  created_at: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

// Form Types
export interface MintNFTForm {
  name: string;
  symbol: string;
  description: string;
  image: File | null;
  attributes: NFTAttribute[];
  royalty: number;
  collection?: string;
}

export interface TransferNFTForm {
  recipient: string;
  nft_mint: string;
}

export interface ListNFTForm {
  nft_mint: string;
  price: number;
  currency: "SOL" | "USDC";
  duration?: number; // in days
}

// Storage Types
export interface StorageProvider {
  name: "arweave" | "ipfs" | "nft_storage";
  upload: (file: File) => Promise<string>;
  uploadMetadata: (metadata: NFTMetadata) => Promise<string>;
}

// Network Types
export type SolanaNetwork = "mainnet-beta" | "devnet" | "testnet";

export interface NetworkConfig {
  name: SolanaNetwork;
  rpcEndpoint: string;
  wsEndpoint?: string;
  explorerUrl: string;
}

// Error Types
export interface SolanaError {
  code: number;
  message: string;
  logs?: string[];
}

// Utility Types
export type Address = string;
export type Signature = string;
export type Lamports = number;
