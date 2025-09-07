"use client";

import { WalletButton } from "@/components/wallet/WalletButton";
import { useWallet } from "@/hooks/useWallet";
import { formatSol } from "@/lib/solana/wallet";
import { CURRENT_NETWORK } from "@/constants";

export default function Home() {
  const { connected, publicKey, balance } = useWallet();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-white">SolMint</h1>
          <span className="px-2 py-1 bg-yellow-500 text-black text-xs rounded-full uppercase font-semibold">
            {CURRENT_NETWORK}
          </span>
        </div>
        <WalletButton />
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-white mb-4">
            Create, Trade & Discover
          </h2>
          <h3 className="text-3xl text-purple-200 mb-6">NFTs on Solana</h3>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            The fastest and most affordable NFT marketplace built on Solana
            blockchain. Mint your digital assets with minimal fees and
            lightning-fast transactions.
          </p>
        </div>

        {/* Wallet Status */}
        {connected && publicKey ? (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md mx-auto mb-12">
            <h4 className="text-xl font-semibold text-white mb-4">
              Wallet Connected
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Address:</span>
                <span className="text-white font-mono text-sm">
                  {publicKey.toBase58().slice(0, 8)}...
                  {publicKey.toBase58().slice(-8)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Balance:</span>
                <span className="text-white font-semibold">
                  {formatSol(balance)} SOL
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Network:</span>
                <span className="text-purple-300 capitalize">
                  {CURRENT_NETWORK}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md mx-auto mb-12">
            <h4 className="text-xl font-semibold text-white mb-4">
              Get Started
            </h4>
            <p className="text-gray-300 mb-6">
              Connect your Solana wallet to start minting and trading NFTs.
            </p>
            <div className="flex justify-center">
              <WalletButton className="w-full" />
            </div>
          </div>
        )}

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-purple-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-white text-xl">🎨</span>
            </div>
            <h5 className="text-lg font-semibold text-white mb-2">
              Create NFTs
            </h5>
            <p className="text-gray-300 text-sm">
              Mint your digital art with just a few clicks. Upload your artwork
              and create unique NFTs.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-blue-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-white text-xl">💎</span>
            </div>
            <h5 className="text-lg font-semibold text-white mb-2">
              Trade NFTs
            </h5>
            <p className="text-gray-300 text-sm">
              Buy and sell NFTs in our marketplace with low fees and instant
              transactions.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-green-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-white text-xl">⚡</span>
            </div>
            <h5 className="text-lg font-semibold text-white mb-2">
              Fast & Cheap
            </h5>
            <p className="text-gray-300 text-sm">
              Powered by Solana for lightning-fast transactions with minimal
              fees.
            </p>
          </div>
        </div>

        {/* Coming Soon Features */}
        {connected && (
          <div className="mt-16 text-center">
            <h4 className="text-2xl font-bold text-white mb-8">Coming Soon</h4>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors opacity-50 cursor-not-allowed">
                Mint NFT
              </button>
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors opacity-50 cursor-not-allowed">
                Browse Marketplace
              </button>
              <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors opacity-50 cursor-not-allowed">
                My Collection
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
