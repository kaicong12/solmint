"use client";

import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { shortenAddress } from "@/lib/solana/wallet";

interface WalletButtonProps {
  className?: string;
}

export function WalletButton({ className }: WalletButtonProps) {
  const { publicKey, connected, connecting, disconnect } = useWallet();

  if (connected && publicKey) {
    return (
      <div className={`flex items-center gap-2 ${className || ""}`}>
        <span className="text-sm text-gray-600">
          {shortenAddress(publicKey.toBase58())}
        </span>
        <button
          onClick={disconnect}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <WalletMultiButton
      className={`wallet-adapter-button-trigger ${className || ""}`}
    >
      {connecting ? "Connecting..." : "Connect Wallet"}
    </WalletMultiButton>
  );
}
