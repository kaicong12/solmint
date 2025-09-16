"use client";

import { useState, useEffect, useMemo } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  MarketplaceService,
  MarketplaceStatus,
} from "@/lib/solana/marketplace";
import { MARKETPLACE_CONFIG } from "@/constants";

interface MarketplaceInitializationProps {
  onInitialized?: () => void;
}

export function MarketplaceInitialization({
  onInitialized,
}: Readonly<MarketplaceInitializationProps>) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [marketplaceStatus, setMarketplaceStatus] = useState<MarketplaceStatus>(
    {
      isInitialized: false,
      isLoading: true,
      marketplaceAccount: null,
      error: null,
    }
  );
  const [isInitializing, setIsInitializing] = useState(false);
  const [feePercentage, setFeePercentage] = useState(
    MARKETPLACE_CONFIG.PLATFORM_FEE
  );
  const [initError, setInitError] = useState<string | null>(null);

  const marketplaceService = useMemo(
    () => new MarketplaceService(connection),
    [connection]
  );

  // Check marketplace status on component mount and when wallet changes
  useEffect(() => {
    const checkMarketplaceStatus = async () => {
      setMarketplaceStatus((prev) => ({ ...prev, isLoading: true }));
      const status = await marketplaceService.getMarketplaceStatus();
      setMarketplaceStatus(status);

      if (status.isInitialized && onInitialized) {
        onInitialized();
      }
    };

    checkMarketplaceStatus();
  }, [connection, marketplaceService, onInitialized, publicKey]);

  const handleInitializeMarketplace = async () => {
    if (!publicKey || !sendTransaction) {
      setInitError("Wallet not connected");
      return;
    }

    setIsInitializing(true);
    setInitError(null);

    try {
      const signature = await marketplaceService.initializeMarketplace(
        publicKey,
        feePercentage,
        sendTransaction
      );

      console.log("Marketplace initialized successfully:", signature);

      // Refresh marketplace status
      const updatedStatus = await marketplaceService.getMarketplaceStatus();
      setMarketplaceStatus(updatedStatus);

      if (updatedStatus.isInitialized && onInitialized) {
        onInitialized();
      }
    } catch (error) {
      console.error("Failed to initialize marketplace:", error);
      setInitError(
        error instanceof Error
          ? error.message
          : "Failed to initialize marketplace"
      );
    } finally {
      setIsInitializing(false);
    }
  };

  const isAdmin = publicKey ? marketplaceService.isAdmin(publicKey) : false;

  if (marketplaceStatus.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking marketplace status...</p>
        </div>
      </div>
    );
  }

  if (marketplaceStatus.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Marketplace
          </h2>
          <p className="text-gray-600 mb-4">{marketplaceStatus.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-8">
          <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-white">N</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">NFTMarket</h1>
          <p className="text-gray-600">Solana Marketplace</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Marketplace Not Initialized
          </h2>

          <p className="text-gray-600 mb-6">
            The marketplace needs to be initialized before it can be used.
            {isAdmin
              ? " As an admin, you can initialize it now."
              : " Please contact the administrator to initialize the marketplace."}
          </p>

          {isAdmin && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="feePercentage"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Platform Fee Percentage (basis points)
                </label>
                <input
                  type="number"
                  id="feePercentage"
                  min="0"
                  max="1000"
                  value={feePercentage}
                  onChange={(e) =>
                    setFeePercentage(parseInt(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="250 (2.5%)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {feePercentage} basis points ={" "}
                  {(feePercentage / 100).toFixed(2)}%
                </p>
              </div>

              {initError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{initError}</p>
                </div>
              )}

              <button
                onClick={handleInitializeMarketplace}
                disabled={isInitializing || !publicKey}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isInitializing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Initializing...
                  </div>
                ) : (
                  "Initialize Marketplace"
                )}
              </button>
            </div>
          )}

          {!isAdmin && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                <strong>Admin Access Required:</strong> Only the marketplace
                administrator can initialize the platform.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
