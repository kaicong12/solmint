"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function WalletConnectionScreen() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white">N</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">NFTMarket</h1>
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
