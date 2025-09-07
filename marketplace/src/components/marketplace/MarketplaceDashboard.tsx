"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useMarketplace } from "@/hooks/useMarketplace";

interface MarketplaceDashboardProps {
  className?: string;
}

export const MarketplaceDashboard: React.FC<MarketplaceDashboardProps> = ({
  className = "",
}) => {
  const { connected, publicKey } = useWallet();
  const {
    loading,
    error,
    initializeMarketplace,
    listNft,
    buyNft,
    cancelListing,
    updateMarketplaceFee,
    getMarketplaceAccount,
    formatPrice,
  } = useMarketplace();

  const [activeTab, setActiveTab] = useState<
    "init" | "list" | "buy" | "cancel" | "admin"
  >("init");
  const [marketplaceData, setMarketplaceData] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [feePercentage, setFeePercentage] = useState<number>(250); // 2.5%
  const [nftMint, setNftMint] = useState<string>("");
  const [sellerTokenAccount, setSellerTokenAccount] = useState<string>("");
  const [price, setPrice] = useState<number>(1);
  const [seller, setSeller] = useState<string>("");
  const [buyerTokenAccount, setBuyerTokenAccount] = useState<string>("");
  const [newFeePercentage, setNewFeePercentage] = useState<number>(250);

  const loadMarketplaceData = useCallback(async () => {
    if (!publicKey) return;

    try {
      const data = await getMarketplaceAccount(publicKey.toBase58());
      setMarketplaceData(data);
    } catch (err) {
      console.error("Failed to load marketplace data:", err);
    }
  }, [publicKey, getMarketplaceAccount]);

  // Load marketplace data when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      loadMarketplaceData();
    }
  }, [connected, publicKey, loadMarketplaceData]);

  const handleInitializeMarketplace = async () => {
    const signature = await initializeMarketplace(feePercentage);
    if (signature) {
      setSuccessMessage(`Marketplace initialized! Transaction: ${signature}`);
      await loadMarketplaceData();
    }
  };

  const handleListNft = async () => {
    if (!nftMint || !sellerTokenAccount || price <= 0) {
      alert("Please fill in all fields with valid values");
      return;
    }

    const signature = await listNft(nftMint, sellerTokenAccount, price);
    if (signature) {
      setSuccessMessage(
        `NFT listed for ${price} SOL! Transaction: ${signature}`
      );
      // Reset form
      setNftMint("");
      setSellerTokenAccount("");
      setPrice(1);
    }
  };

  const handleBuyNft = async () => {
    if (!nftMint || !seller || !buyerTokenAccount || !sellerTokenAccount) {
      alert("Please fill in all fields");
      return;
    }

    const signature = await buyNft(
      nftMint,
      seller,
      buyerTokenAccount,
      sellerTokenAccount
    );
    if (signature) {
      setSuccessMessage(`NFT purchased! Transaction: ${signature}`);
      // Reset form
      setNftMint("");
      setSeller("");
      setBuyerTokenAccount("");
      setSellerTokenAccount("");
    }
  };

  const handleCancelListing = async () => {
    if (!nftMint) {
      alert("Please enter NFT mint address");
      return;
    }

    const signature = await cancelListing(nftMint);
    if (signature) {
      setSuccessMessage(`Listing cancelled! Transaction: ${signature}`);
      setNftMint("");
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

  if (!connected) {
    return (
      <div
        className={`bg-white/10 backdrop-blur-md rounded-2xl p-8 ${className}`}
      >
        <h3 className="text-xl font-semibold text-white mb-4">
          Marketplace Dashboard
        </h3>
        <p className="text-gray-300">
          Please connect your wallet to access the marketplace.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`bg-white/10 backdrop-blur-md rounded-2xl p-8 ${className}`}
    >
      <h3 className="text-2xl font-bold text-white mb-6">
        Marketplace Dashboard
      </h3>

      {/* Marketplace Status */}
      {marketplaceData && (
        <div className="bg-white/5 rounded-xl p-4 mb-6">
          <h4 className="text-lg font-semibold text-white mb-3">
            Marketplace Status
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-300">Fee Percentage:</span>
              <span className="text-white ml-2">
                {marketplaceData.feePercentage / 100}%
              </span>
            </div>
            <div>
              <span className="text-gray-300">Total Sales:</span>
              <span className="text-white ml-2">
                {marketplaceData.totalSales.toString()}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-300">Total Volume:</span>
              <span className="text-white ml-2">
                {formatPrice(marketplaceData.totalVolume)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: "init", label: "Initialize" },
          { key: "list", label: "List NFT" },
          { key: "buy", label: "Buy NFT" },
          { key: "cancel", label: "Cancel Listing" },
          { key: "admin", label: "Admin" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.key
                ? "bg-purple-600 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Success Message */}
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

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === "init" && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">
              Initialize Marketplace
            </h4>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Fee Percentage (basis points, e.g., 250 = 2.5%)
              </label>
              <input
                type="number"
                value={feePercentage}
                onChange={(e) => setFeePercentage(Number(e.target.value))}
                min="0"
                max="1000"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="250"
              />
            </div>
            <button
              onClick={handleInitializeMarketplace}
              disabled={loading}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Initializing..." : "Initialize Marketplace"}
            </button>
          </div>
        )}

        {activeTab === "list" && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">
              List NFT for Sale
            </h4>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                NFT Mint Address
              </label>
              <input
                type="text"
                value={nftMint}
                onChange={(e) => setNftMint(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter NFT mint address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Seller Token Account
              </label>
              <input
                type="text"
                value={sellerTokenAccount}
                onChange={(e) => setSellerTokenAccount(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter seller token account address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Price (SOL)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="1.0"
              />
            </div>
            <button
              onClick={handleListNft}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Listing..." : "List NFT"}
            </button>
          </div>
        )}

        {activeTab === "buy" && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Buy NFT</h4>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                NFT Mint Address
              </label>
              <input
                type="text"
                value={nftMint}
                onChange={(e) => setNftMint(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter NFT mint address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Seller Address
              </label>
              <input
                type="text"
                value={seller}
                onChange={(e) => setSeller(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter seller address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Buyer Token Account
              </label>
              <input
                type="text"
                value={buyerTokenAccount}
                onChange={(e) => setBuyerTokenAccount(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter buyer token account address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Seller Token Account
              </label>
              <input
                type="text"
                value={sellerTokenAccount}
                onChange={(e) => setSellerTokenAccount(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter seller token account address"
              />
            </div>
            <button
              onClick={handleBuyNft}
              disabled={loading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Buying..." : "Buy NFT"}
            </button>
          </div>
        )}

        {activeTab === "cancel" && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">
              Cancel NFT Listing
            </h4>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                NFT Mint Address
              </label>
              <input
                type="text"
                value={nftMint}
                onChange={(e) => setNftMint(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter NFT mint address"
              />
            </div>
            <button
              onClick={handleCancelListing}
              disabled={loading}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Cancelling..." : "Cancel Listing"}
            </button>
          </div>
        )}

        {activeTab === "admin" && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">
              Admin Functions
            </h4>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New Fee Percentage (basis points)
              </label>
              <input
                type="number"
                value={newFeePercentage}
                onChange={(e) => setNewFeePercentage(Number(e.target.value))}
                min="0"
                max="1000"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="250"
              />
            </div>
            <button
              onClick={handleUpdateFee}
              disabled={loading}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Updating..." : "Update Marketplace Fee"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
