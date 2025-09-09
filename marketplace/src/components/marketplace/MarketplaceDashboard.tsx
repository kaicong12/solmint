"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useMarketplace } from "@/hooks/useMarketplace";
import { useBackendApi } from "@/hooks/useBackendApi";
import { MarketplaceAccount } from "@/lib/solana/program";
import { NFT, Listing } from "@/types";

interface MarketplaceDashboardProps {
  className?: string;
}

export const MarketplaceDashboard: React.FC<MarketplaceDashboardProps> = () => {
  const { connected, publicKey } = useWallet();
  const {
    loading: blockchainLoading,
    error: blockchainError,
    initializeMarketplace,
    updateMarketplaceFee,
    getMarketplaceAccount,
  } = useMarketplace();

  const {
    loading: apiLoading,
    error: apiError,
    listings,
    marketplaceStats,
    loadListings,
    loadMarketplaceStats,
    checkHealth,
    addToFavorites,
    removeFromFavorites,
    userFavorites,
  } = useBackendApi();

  const [marketplaceData, setMarketplaceData] =
    useState<MarketplaceAccount | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<
    "All" | "Listed" | "Unlisted"
  >("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [newFeePercentage, setNewFeePercentage] = useState<number>(250);
  const [backendHealthy, setBackendHealthy] = useState<boolean>(false);

  const loading = blockchainLoading || apiLoading;
  const error = blockchainError || apiError;

  const loadMarketplaceData = useCallback(async () => {
    if (!publicKey) return;

    try {
      const data = await getMarketplaceAccount(publicKey.toBase58());
      setMarketplaceData(data);
    } catch (err) {
      console.error("Failed to load marketplace data:", err);
    }
  }, [publicKey, getMarketplaceAccount]);

  // Load initial data
  useEffect(() => {
    const initializeData = async () => {
      // Check backend health
      const healthy = await checkHealth();
      setBackendHealthy(healthy);

      if (healthy) {
        // Load marketplace data
        await loadListings({ limit: 20 });
        await loadMarketplaceStats();
      }
    };

    initializeData();
  }, [checkHealth, loadListings, loadMarketplaceStats]);

  useEffect(() => {
    if (connected && publicKey) {
      loadMarketplaceData();
    }
  }, [connected, publicKey, loadMarketplaceData]);

  const handleInitializeMarketplace = async () => {
    const signature = await initializeMarketplace(250); // 2.5% default fee
    if (signature) {
      setSuccessMessage(`Marketplace initialized! Transaction: ${signature}`);
      await loadMarketplaceData();
    }
  };

  const handleUpdateFee = async () => {
    const signature = await updateMarketplaceFee(newFeePercentage);
    if (signature) {
      setSuccessMessage(
        `Marketplace fee updated to ${
          newFeePercentage / 100
        }%! Transaction: ${signature}`
      );
      await loadMarketplaceData();
    }
  };

  const handleBuyNft = async (listing: Listing) => {
    // This would integrate with the blockchain transaction
    setSuccessMessage(
      `Buy functionality for NFT ${listing.nft_mint} would be implemented here`
    );
  };

  const handleToggleFavorite = async (mint: string) => {
    if (!connected) return;

    const isFavorite = userFavorites.some((nft) => nft.mint === mint);

    try {
      if (isFavorite) {
        await removeFromFavorites(mint);
        setSuccessMessage("Removed from favorites");
      } else {
        await addToFavorites(mint);
        setSuccessMessage("Added to favorites");
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  const filteredListings = listings.filter((listing) => {
    const nft = listing.nft;
    if (!nft) return false;

    const matchesSearch =
      nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nft.symbol.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      activeFilter === "All" ||
      (activeFilter === "Listed" && listing.status === "active") ||
      (activeFilter === "Unlisted" && listing.status !== "active");

    return matchesSearch && matchesFilter;
  });

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <h1 className="text-4xl font-bold text-white mb-4">
              Welcome to SolMint
            </h1>
            <p className="text-gray-300 mb-8">
              The future of NFT trading on Solana
            </p>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-white mb-4">
                Get Started
              </h3>
              <p className="text-gray-300">
                Please connect your wallet to access the marketplace.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-purple-600 px-3 py-1 rounded-full text-sm text-white">
              Live on Solana
            </div>
            <h1 className="text-3xl font-bold text-white">
              SolMint Marketplace
            </h1>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6">
            <p className="text-green-300 text-sm break-all">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-400 hover:text-green-300 text-xs mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Current Marketplace Fee */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-gray-300">💰</span>
              <h3 className="text-lg font-semibold text-white">
                Current Marketplace Fee
              </h3>
            </div>
            <div className="text-4xl font-bold text-cyan-400 mb-2">
              {marketplaceData
                ? `${(marketplaceData.feePercentage / 100).toFixed(2)}%`
                : "2.50%"}
            </div>
            <div className="text-sm text-gray-300 mb-4">
              {marketplaceData
                ? `${marketplaceData.feePercentage} basis points`
                : "250 basis points"}
            </div>

            <div className="space-y-2 text-sm">
              <div className="text-gray-300">Fee Examples:</div>
              <div className="flex justify-between">
                <span className="text-gray-400">1 SOL sale:</span>
                <span className="text-white">0.025 SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">10 SOL sale:</span>
                <span className="text-white">0.250 SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">100 SOL sale:</span>
                <span className="text-white">2.50 SOL</span>
              </div>
            </div>
          </div>

          {/* Admin Panel */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-300">⚙️</span>
                <h3 className="text-lg font-semibold text-white">
                  Admin Panel
                </h3>
              </div>
              <span className="bg-purple-600 px-2 py-1 rounded text-xs text-white">
                Admin
              </span>
            </div>

            {!marketplaceData ? (
              <div className="space-y-4">
                <p className="text-gray-300 text-sm">
                  Marketplace not initialized
                </p>
                <button
                  onClick={handleInitializeMarketplace}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Initializing..." : "Initialize Marketplace"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    New Fee (basis points)
                  </label>
                  <input
                    type="number"
                    value={newFeePercentage}
                    onChange={(e) =>
                      setNewFeePercentage(Number(e.target.value))
                    }
                    min="0"
                    max="1000"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="250"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Current: {marketplaceData.feePercentage / 100}% (Max: 10%)
                  </div>
                </div>
                <button
                  onClick={handleUpdateFee}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? "Updating..." : "Update Fee"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Featured Collection */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Featured Collection
              </h2>
              <p className="text-gray-300">Handpicked NFTs from top creators</p>
            </div>
            <div className="bg-green-500 px-3 py-1 rounded-full text-sm text-white">
              🔴 Live Trading
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search NFTs or creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex gap-2">
              {["All", "Listed", "Unlisted"].map((filter) => (
                <button
                  key={filter}
                  onClick={() =>
                    setActiveFilter(filter as "All" | "Listed" | "Unlisted")
                  }
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeFilter === filter
                      ? "bg-purple-600 text-white"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Backend Health Status */}
          {!backendHealthy && (
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-sm">
                ⚠️ Backend API is not available. Showing limited functionality.
              </p>
            </div>
          )}

          {/* Marketplace Stats */}
          {marketplaceStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
                <div className="text-2xl font-bold text-cyan-400">
                  {marketplaceStats.total_volume.toFixed(2)}
                </div>
                <div className="text-sm text-gray-300">Total Volume (SOL)</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">
                  {marketplaceStats.total_sales}
                </div>
                <div className="text-sm text-gray-300">Total Sales</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-400">
                  {marketplaceStats.total_nfts}
                </div>
                <div className="text-sm text-gray-300">Total NFTs</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-400">
                  {marketplaceStats.volume_24h.toFixed(2)}
                </div>
                <div className="text-sm text-gray-300">24h Volume (SOL)</div>
              </div>
            </div>
          )}

          {/* NFT Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading && (
              <div className="col-span-full text-center py-8">
                <div className="text-white">Loading NFTs...</div>
              </div>
            )}

            {!loading && filteredListings.length === 0 && (
              <div className="col-span-full text-center py-8">
                <div className="text-gray-400">
                  No NFTs found matching your criteria.
                </div>
              </div>
            )}

            {filteredListings.map((listing) => {
              const nft = listing.nft;
              if (!nft) return null;

              const isFavorite = userFavorites.some(
                (fav) => fav.mint === nft.mint
              );

              return (
                <div
                  key={listing.id}
                  className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300"
                >
                  <div className="relative">
                    <img
                      src={
                        nft.image ||
                        "https://via.placeholder.com/300x300/8B5CF6/FFFFFF?text=NFT"
                      }
                      alt={nft.name}
                      className="w-full h-64 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src =
                          "https://via.placeholder.com/300x300/8B5CF6/FFFFFF?text=NFT";
                      }}
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-purple-600 text-white">
                        {listing.status === "active" ? "Listed" : "Unlisted"}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4">
                      <button
                        onClick={() => handleToggleFavorite(nft.mint)}
                        className={`p-2 rounded-full transition-colors ${
                          isFavorite
                            ? "bg-red-500/70 hover:bg-red-500/90"
                            : "bg-black/50 hover:bg-black/70"
                        }`}
                      >
                        <svg
                          className="w-4 h-4 text-white"
                          fill={isFavorite ? "currentColor" : "none"}
                          stroke="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {nft.name}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {nft.symbol} • {nft.mint.slice(0, 8)}...
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-cyan-400">
                          {listing.price} {listing.currency}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4 text-sm text-gray-400">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {nft.verified ? "Verified" : "Unverified"}
                        </span>
                        <span className="text-xs">
                          Listed:{" "}
                          {new Date(listing.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleBuyNft(listing)}
                      disabled={listing.status !== "active"}
                      className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                    >
                      {listing.status === "active"
                        ? "🛒 Buy Now"
                        : "Not Available"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 h-1 w-full mb-6 rounded"></div>
          <p className="text-gray-300 mb-2">
            The future of NFT trading on Solana
          </p>
          <div className="inline-flex items-center gap-2 bg-purple-600 px-4 py-2 rounded-full text-sm text-white">
            <span>Powered by Solana</span>
          </div>
        </div>
      </div>
    </div>
  );
};
