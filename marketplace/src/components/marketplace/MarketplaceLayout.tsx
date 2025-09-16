"use client";

import { useState, useEffect, useMemo } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { MarketplaceInitialization } from "./MarketplaceInitialization";
import { WalletConnectionScreen } from "./WalletConnectionScreen";
import { MarketplaceContent } from "./MarketplaceContent";
import {
  MarketplaceService,
  MarketplaceStatus,
} from "@/lib/solana/marketplace";

export function MarketplaceLayout() {
  const { connected } = useWallet();
  const { connection } = useConnection();
  const [marketplaceStatus, setMarketplaceStatus] = useState<MarketplaceStatus>(
    {
      isInitialized: false,
      isLoading: true,
      marketplaceAccount: null,
      error: null,
    }
  );

  const marketplaceService = useMemo(
    () => new MarketplaceService(connection),
    [connection]
  );

  // Check marketplace status when wallet connects
  useEffect(() => {
    if (connected) {
      const checkMarketplaceStatus = async () => {
        setMarketplaceStatus((prev) => ({ ...prev, isLoading: true }));
        const status = await marketplaceService.getMarketplaceStatus();
        setMarketplaceStatus(status);
      };

      checkMarketplaceStatus();
    }
  }, [connected, connection, marketplaceService]);

  const handleMarketplaceInitialized = () => {
    // Refresh marketplace status after initialization
    const refreshStatus = async () => {
      const status = await marketplaceService.getMarketplaceStatus();
      setMarketplaceStatus(status);
    };
    refreshStatus();
  };

  // Show wallet connection screen if not connected
  if (!connected) {
    return <WalletConnectionScreen />;
  }

  // Show marketplace initialization screen if not initialized
  if (!marketplaceStatus.isInitialized && !marketplaceStatus.isLoading) {
    return (
      <MarketplaceInitialization onInitialized={handleMarketplaceInitialized} />
    );
  }

  // Show loading screen while checking marketplace status
  if (marketplaceStatus.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  // Show marketplace content if everything is ready
  return <MarketplaceContent />;
}
