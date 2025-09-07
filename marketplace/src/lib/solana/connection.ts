import {
  Connection,
  ConnectionConfig,
  Commitment,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { CURRENT_RPC_ENDPOINT, TRANSACTION_CONFIG } from "@/constants";

// Connection configuration for optimal performance
const CONNECTION_CONFIG: ConnectionConfig = {
  commitment: TRANSACTION_CONFIG.COMMITMENT,
  confirmTransactionInitialTimeout: TRANSACTION_CONFIG.CONFIRMATION_TIMEOUT,
  wsEndpoint: undefined, // Will be set based on network
  httpHeaders: {
    "Content-Type": "application/json",
  },
};

// Singleton connection instance
let connectionInstance: Connection | null = null;

/**
 * Get or create a Solana connection instance
 * Uses singleton pattern for connection reuse
 */
export function getConnection(): Connection {
  if (!connectionInstance) {
    connectionInstance = new Connection(
      CURRENT_RPC_ENDPOINT,
      CONNECTION_CONFIG
    );
  }
  return connectionInstance;
}

/**
 * Create a new connection with custom endpoint
 */
export function createConnection(
  endpoint: string,
  config?: ConnectionConfig
): Connection {
  const mergedConfig = { ...CONNECTION_CONFIG, ...config };
  return new Connection(endpoint, mergedConfig);
}

/**
 * Test connection health
 */
export async function testConnection(
  connection?: Connection
): Promise<boolean> {
  try {
    const conn = connection || getConnection();
    const version = await conn.getVersion();
    return !!version;
  } catch (error) {
    console.error("Connection test failed:", error);
    return false;
  }
}

/**
 * Get connection info including slot and block height
 */
export async function getConnectionInfo(connection?: Connection) {
  try {
    const conn = connection || getConnection();
    const [slot, blockHeight, version] = await Promise.all([
      conn.getSlot(),
      conn.getBlockHeight(),
      conn.getVersion(),
    ]);

    return {
      slot,
      blockHeight,
      version,
      endpoint: conn.rpcEndpoint,
    };
  } catch (error) {
    console.error("Failed to get connection info:", error);
    throw error;
  }
}

/**
 * Wait for transaction confirmation with timeout
 */
export async function confirmTransaction(
  signature: string,
  commitment: Commitment = TRANSACTION_CONFIG.COMMITMENT,
  connection?: Connection
): Promise<boolean> {
  try {
    const conn = connection || getConnection();
    const confirmation = await conn.confirmTransaction(signature, commitment);
    return !confirmation.value.err;
  } catch (error) {
    console.error("Transaction confirmation failed:", error);
    return false;
  }
}

/**
 * Get recent blockhash with retry logic
 */
export async function getRecentBlockhash(
  connection?: Connection,
  commitment: Commitment = TRANSACTION_CONFIG.COMMITMENT
) {
  const conn = connection || getConnection();
  let retries = TRANSACTION_CONFIG.MAX_RETRIES;

  while (retries > 0) {
    try {
      const { blockhash, feeCalculator } = await conn.getRecentBlockhash(
        commitment
      );
      return { blockhash, feeCalculator };
    } catch (error) {
      retries--;
      if (retries === 0) {
        throw error;
      }
      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error("Failed to get recent blockhash after retries");
}

/**
 * Get minimum rent exemption for account size
 */
export async function getMinimumRentExemption(
  dataLength: number,
  connection?: Connection
): Promise<number> {
  try {
    const conn = connection || getConnection();
    return await conn.getMinimumBalanceForRentExemption(dataLength);
  } catch (error) {
    console.error("Failed to get minimum rent exemption:", error);
    throw error;
  }
}

/**
 * Estimate transaction fees
 */
export async function estimateTransactionFee(
  transaction: Transaction | VersionedTransaction,
  connection?: Connection
): Promise<number> {
  try {
    const conn = connection || getConnection();
    const message =
      transaction instanceof Transaction
        ? transaction.compileMessage()
        : transaction.message;
    const fees = await conn.getFeeForMessage(message);
    return fees?.value || 0;
  } catch (error) {
    console.error("Failed to estimate transaction fee:", error);
    return 5000; // Default fallback fee in lamports
  }
}

/**
 * Reset connection instance (useful for network switching)
 */
export function resetConnection(): void {
  connectionInstance = null;
}
