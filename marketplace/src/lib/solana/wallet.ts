import { PublicKey, Connection } from "@solana/web3.js";
import { WalletAdapter } from "@solana/wallet-adapter-base";
import { VALIDATION_RULES } from "@/constants";

/**
 * Validate if a string is a valid Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return VALIDATION_RULES.WALLET_ADDRESS.test(address);
  } catch {
    return false;
  }
}

/**
 * Shorten a Solana address for display
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Convert lamports to SOL
 */
export function lamportsToSol(lamports: number): number {
  return lamports / 1_000_000_000;
}

/**
 * Convert SOL to lamports
 */
export function solToLamports(sol: number): number {
  return Math.floor(sol * 1_000_000_000);
}

/**
 * Format SOL amount for display
 */
export function formatSol(lamports: number, decimals = 4): string {
  const sol = lamportsToSol(lamports);
  return sol.toFixed(decimals);
}

/**
 * Get explorer URL for address
 */
export function getExplorerUrl(
  address: string,
  type: "address" | "tx" = "address",
  cluster?: string
): string {
  const baseUrl = "https://explorer.solana.com";
  const clusterParam =
    cluster && cluster !== "mainnet-beta" ? `?cluster=${cluster}` : "";
  return `${baseUrl}/${type}/${address}${clusterParam}`;
}

/**
 * Parse error message from wallet or transaction
 */
export function parseWalletError(error: unknown): string {
  if (typeof error === "string") return error;

  if (error && typeof error === "object") {
    const err = error as { name?: string; message?: string };

    // Wallet adapter errors
    if (err.name === "WalletNotConnectedError") {
      return "Wallet not connected";
    }
    if (err.name === "WalletDisconnectedError") {
      return "Wallet disconnected";
    }
    if (err.name === "WalletTimeoutError") {
      return "Wallet connection timeout";
    }
    if (err.name === "WalletNotReadyError") {
      return "Wallet not ready";
    }
    if (err.name === "WalletLoadError") {
      return "Failed to load wallet";
    }
    if (err.name === "WalletConfigError") {
      return "Wallet configuration error";
    }

    // Transaction errors
    if (err.message?.includes("insufficient funds")) {
      return "Insufficient funds for transaction";
    }
    if (err.message?.includes("blockhash not found")) {
      return "Transaction expired, please try again";
    }
    if (err.message?.includes("Transaction simulation failed")) {
      return "Transaction would fail, please check your inputs";
    }

    // Generic error message
    if (err.message) return err.message;
  }

  return "An unknown error occurred";
}

/**
 * Check if wallet supports required features
 */
export function checkWalletFeatures(wallet: WalletAdapter | null): {
  canSignTransaction: boolean;
  canSignAllTransactions: boolean;
  canSignMessage: boolean;
} {
  if (!wallet) {
    return {
      canSignTransaction: false,
      canSignAllTransactions: false,
      canSignMessage: false,
    };
  }

  return {
    canSignTransaction:
      "signTransaction" in wallet &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof (wallet as any).signTransaction === "function",
    canSignAllTransactions:
      "signAllTransactions" in wallet &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof (wallet as any).signAllTransactions === "function",
    canSignMessage:
      "signMessage" in wallet &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof (wallet as any).signMessage === "function",
  };
}

/**
 * Get wallet balance with error handling
 */
export async function getWalletBalance(
  publicKey: PublicKey,
  connection: Connection
): Promise<number> {
  try {
    return await connection.getBalance(publicKey);
  } catch (error) {
    console.error("Failed to get wallet balance:", error);
    return 0;
  }
}

/**
 * Validate transaction signature
 */
export function isValidTransactionSignature(signature: string): boolean {
  return VALIDATION_RULES.TRANSACTION_SIGNATURE.test(signature);
}

/**
 * Create a deterministic seed from wallet address
 */
export function createSeedFromWallet(
  publicKey: PublicKey,
  prefix = ""
): string {
  return `${prefix}${publicKey.toBase58().slice(0, 8)}`;
}
