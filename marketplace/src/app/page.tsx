"use client";

import { SolanaWalletProvider } from "@/components/wallet/WalletProvider";
import { MarketplaceLayout } from "@/components/marketplace/MarketplaceLayout";

export default function Home() {
  return (
    <SolanaWalletProvider>
      <MarketplaceLayout />
    </SolanaWalletProvider>
  );
}
