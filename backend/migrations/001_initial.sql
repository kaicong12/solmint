-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for storing user profiles and preferences
CREATE TABLE users (
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

-- NFT Collections table
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    description TEXT,
    image_url TEXT,
    banner_url TEXT,
    creator_address VARCHAR(44) NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    floor_price BIGINT,
    total_volume BIGINT DEFAULT 0,
    total_supply INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NFTs table for indexing all NFTs
CREATE TABLE nfts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mint_address VARCHAR(44) UNIQUE NOT NULL,
    collection_id UUID REFERENCES collections(id),
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

-- Marketplace listings table (indexed from blockchain)
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_address VARCHAR(44) UNIQUE NOT NULL,
    nft_mint VARCHAR(44) NOT NULL REFERENCES nfts(mint_address),
    seller_address VARCHAR(44) NOT NULL,
    price BIGINT NOT NULL,
    marketplace_address VARCHAR(44) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
    transaction_signature VARCHAR(88),
    block_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales history table
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nft_mint VARCHAR(44) NOT NULL REFERENCES nfts(mint_address),
    seller_address VARCHAR(44) NOT NULL,
    buyer_address VARCHAR(44) NOT NULL,
    price BIGINT NOT NULL,
    marketplace_fee BIGINT NOT NULL,
    transaction_signature VARCHAR(88) UNIQUE NOT NULL,
    block_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User favorites table
CREATE TABLE user_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nft_mint VARCHAR(44) NOT NULL REFERENCES nfts(mint_address),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, nft_mint)
);

-- User watchlists for collections
CREATE TABLE user_watchlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, collection_id)
);

-- Price alerts table
CREATE TABLE price_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nft_mint VARCHAR(44) REFERENCES nfts(mint_address),
    collection_id UUID REFERENCES collections(id),
    target_price BIGINT NOT NULL,
    condition VARCHAR(10) NOT NULL CHECK (condition IN ('above', 'below')),
    is_active BOOLEAN DEFAULT TRUE,
    triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity feed table
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_type VARCHAR(20) NOT NULL CHECK (activity_type IN ('listing', 'sale', 'transfer', 'mint', 'burn')),
    nft_mint VARCHAR(44) NOT NULL REFERENCES nfts(mint_address),
    from_address VARCHAR(44),
    to_address VARCHAR(44),
    price BIGINT,
    transaction_signature VARCHAR(88),
    block_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketplace statistics table
CREATE TABLE marketplace_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    total_volume BIGINT DEFAULT 0,
    total_sales INTEGER DEFAULT 0,
    unique_buyers INTEGER DEFAULT 0,
    unique_sellers INTEGER DEFAULT 0,
    average_price BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date)
);

-- Indexer state table to track blockchain sync progress
CREATE TABLE indexer_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    last_processed_slot BIGINT NOT NULL DEFAULT 0,
    last_processed_signature VARCHAR(88),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_nfts_mint_address ON nfts(mint_address);
CREATE INDEX idx_nfts_collection_id ON nfts(collection_id);
CREATE INDEX idx_nfts_current_owner ON nfts(current_owner);
CREATE INDEX idx_nfts_creator_address ON nfts(creator_address);

CREATE INDEX idx_listings_nft_mint ON listings(nft_mint);
CREATE INDEX idx_listings_seller_address ON listings(seller_address);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_listings_created_at ON listings(created_at);

CREATE INDEX idx_sales_nft_mint ON sales(nft_mint);
CREATE INDEX idx_sales_seller_address ON sales(seller_address);
CREATE INDEX idx_sales_buyer_address ON sales(buyer_address);
CREATE INDEX idx_sales_block_time ON sales(block_time);
CREATE INDEX idx_sales_price ON sales(price);

CREATE INDEX idx_activities_nft_mint ON activities(nft_mint);
CREATE INDEX idx_activities_activity_type ON activities(activity_type);
CREATE INDEX idx_activities_block_time ON activities(block_time);
CREATE INDEX idx_activities_from_address ON activities(from_address);
CREATE INDEX idx_activities_to_address ON activities(to_address);

CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_collections_creator_address ON collections(creator_address);

-- Create composite indexes for common queries
CREATE INDEX idx_listings_status_price ON listings(status, price);
CREATE INDEX idx_nfts_collection_owner ON nfts(collection_id, current_owner);
CREATE INDEX idx_sales_nft_block_time ON sales(nft_mint, block_time DESC);
