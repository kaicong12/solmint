import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  getMarketplacePDA,
  createInitializeMarketplaceInstruction,
  MarketplaceAccount,
  MarketplaceData,
  MarketplaceSchema,
} from "./program";
import { ADMIN_CONFIG } from "@/constants";
import { deserialize } from "borsh";

type SendTransactionFunction = (
  transaction: Transaction | VersionedTransaction,
  connection: Connection,
  options?: Record<string, unknown>
) => Promise<string>;

export interface MarketplaceStatus {
  isInitialized: boolean;
  isLoading: boolean;
  marketplaceAccount: MarketplaceAccount | null;
  error: string | null;
}

export class MarketplaceService {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Get the marketplace PDA for the admin
   */
  getMarketplacePDA(): [PublicKey, number] {
    const adminPublicKey = new PublicKey(ADMIN_CONFIG.ADMIN_PUBLIC_KEY);
    return getMarketplacePDA(adminPublicKey);
  }

  /**
   * Fetch marketplace account data
   */
  async fetchMarketplaceAccount(): Promise<MarketplaceStatus> {
    try {
      const [marketplacePDA] = this.getMarketplacePDA();

      const accountInfo = await this.connection.getAccountInfo(marketplacePDA);
      console.log({ marketplacePDA, accountInfo });

      if (!accountInfo) {
        return {
          isInitialized: false,
          isLoading: false,
          marketplaceAccount: null,
          error: null,
        };
      }

      // Parse the account data according to the Marketplace struct
      const data = accountInfo.data;

      if (data.length < 67) {
        // Minimum size for Marketplace account (1 + 32 + 2 + 32 = 67 bytes)
        return {
          isInitialized: false,
          isLoading: false,
          marketplaceAccount: null,
          error: "Invalid account data size",
        };
      }

      // Deserialize the account data using borsh
      const deserializedData = deserialize(
        MarketplaceSchema,
        MarketplaceData,
        data
      );

      if (!deserializedData.isInitialized) {
        return {
          isInitialized: false,
          isLoading: false,
          marketplaceAccount: null,
          error: null,
        };
      }

      const authority = new PublicKey(deserializedData.authority);
      const feeRecipient = new PublicKey(deserializedData.feeRecipient);

      const marketplaceAccount: MarketplaceAccount = {
        isInitialized: true,
        authority,
        feePercentage: deserializedData.feePercentage,
        feeRecipient,
        totalVolume: BigInt(0), // These would need to be parsed if stored in the account
        totalSales: BigInt(0),
      };

      return {
        isInitialized: true,
        isLoading: false,
        marketplaceAccount,
        error: null,
      };
    } catch (error) {
      console.error("Error fetching marketplace account:", error);
      return {
        isInitialized: false,
        isLoading: false,
        marketplaceAccount: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check if the current user is the admin
   */
  isAdmin(userPublicKey: PublicKey | null): boolean {
    if (!userPublicKey) return false;

    const adminPublicKey = new PublicKey(ADMIN_CONFIG.ADMIN_PUBLIC_KEY);
    return userPublicKey.equals(adminPublicKey);
  }

  /**
   * Initialize the marketplace
   */
  async initializeMarketplace(
    userPublicKey: PublicKey,
    feePercentage: number,
    sendTransaction: SendTransactionFunction
  ): Promise<string> {
    if (!this.isAdmin(userPublicKey)) {
      throw new Error("Only admin can initialize the marketplace");
    }

    if (feePercentage < 0 || feePercentage > 1000) {
      throw new Error(
        "Fee percentage must be between 0 and 1000 basis points (0-10%)"
      );
    }

    try {
      const instruction = createInitializeMarketplaceInstruction(
        userPublicKey,
        feePercentage
      );

      const transaction = new Transaction().add(instruction);

      // Get recent blockhash
      const {
        context: { slot: minContextSlot },
        value: { blockhash, lastValidBlockHeight },
      } = await this.connection.getLatestBlockhashAndContext();

      const transactionSignature = await sendTransaction(
        transaction,
        this.connection,
        { minContextSlot }
      );

      await this.connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature: transactionSignature,
      });

      return transactionSignature;
    } catch (error) {
      console.error("Error initializing marketplace:", error);
      throw error;
    }
  }

  /**
   * Get marketplace initialization status with real-time updates
   */
  async getMarketplaceStatus(): Promise<MarketplaceStatus> {
    return this.fetchMarketplaceAccount();
  }
}

// Hook for using marketplace service
export const useMarketplaceService = (connection: Connection) => {
  return new MarketplaceService(connection);
};
