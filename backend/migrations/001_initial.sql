-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for storing user profiles and preferences
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(44) UNIQUE NOT NULL,
    username VARCHAR(50),
    email VARCHAR(255),
    bio TEXT,
    avatar_url TEXT,
    twitter_handle VARCHAR(50),
    discord_handle VARCHAR(50),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NFTs table for indexing all NFTs
CREATE TABLE IF NOT EXISTS nfts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mint_address VARCHAR(44) UNIQUE NOT NULL,
    collection_id UUID,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    animation_url TEXT,
    external_url TEXT,
    attributes JSONB,
    creator_address VARCHAR(44) NOT NULL,
    current_owner VARCHAR(44) NOT NULL,
    is_compressed BOOLEAN DEFAULT FALSE,
    rarity_rank INTEGER,
    rarity_score DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nft_mint VARCHAR(44) NOT NULL REFERENCES nfts(mint_address),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, nft_mint)
);

-- Indexer state table to track blockchain sync progress
CREATE TABLE IF NOT EXISTS indexer_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    last_processed_slot BIGINT NOT NULL DEFAULT 0,
    last_processed_signature VARCHAR(88),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_nfts_mint_address ON nfts(mint_address);
CREATE INDEX IF NOT EXISTS idx_nfts_collection_id ON nfts(collection_id);
CREATE INDEX IF NOT EXISTS idx_nfts_current_owner ON nfts(current_owner);
CREATE INDEX IF NOT EXISTS idx_nfts_creator_address ON nfts(creator_address);

CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_nfts_collection_owner ON nfts(collection_id, current_owner);
