"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { MarketplaceHeader } from "./MarketplaceHeader";
import { MarketplaceSidebar } from "./MarketplaceSidebar";
import { NFTGrid } from "./NFTGrid";
import { api } from "@/lib/api/client";
import { NFT, Collection } from "@/types";

export function MarketplaceLayout() {
  const { connected } = useWallet();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load NFTs and collections
        const [nftsResponse, collectionsResponse] = await Promise.all([
          api.nfts.list({ limit: 50 }),
          api.collections.list({ limit: 20 }),
        ]);

        if (nftsResponse.success && nftsResponse.data) {
          setNfts(nftsResponse.data.data);
        }

        if (collectionsResponse.success && collectionsResponse.data) {
          setCollections(collectionsResponse.data.data);
        }
      } catch (error) {
        console.error("Failed to load marketplace data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter NFTs based on search and filters
  const filteredNfts = nfts.filter((nft) => {
    // Search filter
    if (
      searchQuery &&
      !nft.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Collection filter
    if (
      selectedCollections.length > 0 &&
      nft.collection_id &&
      !selectedCollections.includes(nft.collection_id)
    ) {
      return false;
    }

    return true;
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCollectionFilter = (collectionIds: string[]) => {
    setSelectedCollections(collectionIds);
  };

  const handlePriceFilter = () => {
    // Price filter functionality can be implemented when needed
  };

  const handleStatusFilter = () => {
    // Status filter functionality can be implemented when needed
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="mb-8">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">N</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                NFTMarket
              </h1>
              <p className="text-gray-600">Solana Marketplace</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md mx-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Connect Your Wallet
              </h2>
              <p className="text-gray-600 mb-6">
                Connect your Solana wallet to start exploring NFTs
              </p>
              <WalletMultiButton className="!bg-purple-600 !rounded-xl !font-medium" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <MarketplaceHeader onSearch={handleSearch} />

      <div className="flex">
        {/* Sidebar */}
        <MarketplaceSidebar
          collections={collections}
          onCollectionFilter={handleCollectionFilter}
          onPriceFilter={handlePriceFilter}
          onStatusFilter={handleStatusFilter}
        />

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Discover NFTs
              </h1>
              <p className="text-gray-600">
                Explore unique digital assets on Solana
              </p>
              <div className="mt-4 text-sm text-gray-500">
                {filteredNfts.length} items
              </div>
            </div>

            {/* NFT Grid */}
            <NFTGrid nfts={filteredNfts} loading={loading} />
          </div>
        </main>
      </div>
    </div>
  );
}
