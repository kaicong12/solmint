import { useState, useCallback } from "react";
import { useWallet } from "./useWallet";
import { getConnection } from "@/lib/solana/connection";
import { Transaction, PublicKey } from "@solana/web3.js";
import {
  createInitializeMarketplaceInstruction,
  createListNftInstruction,
  createBuyNftInstruction,
  createCancelListingInstruction,
  createUpdateMarketplaceFeeInstruction,
  getMarketplacePDA,
  getListingPDA,
  getMarketplaceFeePDA,
  solToLamports,
  formatPrice,
  MarketplaceAccount,
  ListingAccount,
} from "@/lib/solana/program";

export interface UseMarketplaceReturn {
  // State
  loading: boolean;
  error: string | null;

  // Marketplace operations
  initializeMarketplace: (feePercentage: number) => Promise<string | null>;
  listNft: (
    nftMint: string,
    sellerTokenAccount: string,
    priceInSol: number
  ) => Promise<string | null>;
  buyNft: (
    nftMint: string,
    seller: string,
    buyerTokenAccount: string,
    sellerTokenAccount: string
  ) => Promise<string | null>;
  cancelListing: (nftMint: string) => Promise<string | null>;
  updateMarketplaceFee: (newFeePercentage: number) => Promise<string | null>;

  // Data fetching
  getMarketplaceAccount: (
    authority: string
  ) => Promise<MarketplaceAccount | null>;
  getListingAccount: (
    nftMint: string,
    seller: string
  ) => Promise<ListingAccount | null>;

  // Utility functions
  formatPrice: (lamports: bigint) => string;
  solToLamports: (sol: number) => bigint;
}

export const useMarketplace = (): UseMarketplaceReturn => {
  const { publicKey, signTransaction } = useWallet();
  const connection = getConnection();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((err: unknown, operation: string) => {
    console.error(`Error in ${operation}:`, err);
    const errorMessage = (err as Error)?.message || `Failed to ${operation}`;
    setError(errorMessage);
    return null;
  }, []);

  const executeTransaction = useCallback(
    async (
      transaction: Transaction,
      operation: string
    ): Promise<string | null> => {
      if (!publicKey || !signTransaction) {
        setError("Wallet not connected");
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        // Get recent blockhash
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        // Sign transaction
        const signedTransaction = await signTransaction(transaction);

        // Send transaction
        const signature = await connection.sendRawTransaction(
          signedTransaction.serialize()
        );

        // Confirm transaction
        await connection.confirmTransaction(signature, "confirmed");

        console.log(`${operation} successful:`, signature);
        return signature;
      } catch (err) {
        return handleError(err, operation);
      } finally {
        setLoading(false);
      }
    },
    [publicKey, signTransaction, connection, handleError]
  );

  const initializeMarketplace = useCallback(
    async (feePercentage: number): Promise<string | null> => {
      if (!publicKey) {
        setError("Wallet not connected");
        return null;
      }

      if (feePercentage < 0 || feePercentage > 1000) {
        setError(
          "Fee percentage must be between 0 and 1000 basis points (0-10%)"
        );
        return null;
      }

      const transaction = new Transaction();
      const instruction = createInitializeMarketplaceInstruction(
        publicKey,
        feePercentage
      );
      transaction.add(instruction);

      return executeTransaction(transaction, "initialize marketplace");
    },
    [publicKey, executeTransaction]
  );

  const listNft = useCallback(
    async (
      nftMint: string,
      sellerTokenAccount: string,
      priceInSol: number
    ): Promise<string | null> => {
      if (!publicKey) {
        setError("Wallet not connected");
        return null;
      }

      if (priceInSol <= 0) {
        setError("Price must be greater than 0");
        return null;
      }

      try {
        const nftMintPubkey = new PublicKey(nftMint);
        const sellerTokenAccountPubkey = new PublicKey(sellerTokenAccount);
        const [marketplacePDA] = getMarketplacePDA(publicKey);
        const priceInLamports = solToLamports(priceInSol);

        const transaction = new Transaction();
        const instruction = createListNftInstruction(
          publicKey,
          nftMintPubkey,
          sellerTokenAccountPubkey,
          marketplacePDA,
          priceInLamports
        );
        transaction.add(instruction);

        return executeTransaction(transaction, "list NFT");
      } catch (err) {
        return handleError(err, "list NFT");
      }
    },
    [publicKey, executeTransaction, handleError]
  );

  const buyNft = useCallback(
    async (
      nftMint: string,
      seller: string,
      buyerTokenAccount: string,
      sellerTokenAccount: string
    ): Promise<string | null> => {
      if (!publicKey) {
        setError("Wallet not connected");
        return null;
      }

      try {
        const nftMintPubkey = new PublicKey(nftMint);
        const sellerPubkey = new PublicKey(seller);
        const buyerTokenAccountPubkey = new PublicKey(buyerTokenAccount);
        const sellerTokenAccountPubkey = new PublicKey(sellerTokenAccount);
        const [marketplacePDA] = getMarketplacePDA(sellerPubkey); // Assuming seller is marketplace authority
        const [marketplaceFeePDA] = getMarketplaceFeePDA(marketplacePDA);

        const transaction = new Transaction();
        const tokenProgramId = new PublicKey(
          "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        );
        const instruction = createBuyNftInstruction(
          publicKey,
          sellerPubkey,
          nftMintPubkey,
          buyerTokenAccountPubkey,
          sellerTokenAccountPubkey,
          marketplacePDA,
          marketplaceFeePDA,
          tokenProgramId
        );
        transaction.add(instruction);

        return executeTransaction(transaction, "buy NFT");
      } catch (err) {
        return handleError(err, "buy NFT");
      }
    },
    [publicKey, executeTransaction, handleError]
  );

  const cancelListing = useCallback(
    async (nftMint: string): Promise<string | null> => {
      if (!publicKey) {
        setError("Wallet not connected");
        return null;
      }

      try {
        const nftMintPubkey = new PublicKey(nftMint);

        const transaction = new Transaction();
        const instruction = createCancelListingInstruction(
          publicKey,
          nftMintPubkey
        );
        transaction.add(instruction);

        return executeTransaction(transaction, "cancel listing");
      } catch (err) {
        return handleError(err, "cancel listing");
      }
    },
    [publicKey, executeTransaction, handleError]
  );

  const updateMarketplaceFee = useCallback(
    async (newFeePercentage: number): Promise<string | null> => {
      if (!publicKey) {
        setError("Wallet not connected");
        return null;
      }

      if (newFeePercentage < 0 || newFeePercentage > 1000) {
        setError(
          "Fee percentage must be between 0 and 1000 basis points (0-10%)"
        );
        return null;
      }

      const transaction = new Transaction();
      const instruction = createUpdateMarketplaceFeeInstruction(
        publicKey,
        newFeePercentage
      );
      transaction.add(instruction);

      return executeTransaction(transaction, "update marketplace fee");
    },
    [publicKey, executeTransaction]
  );

  const getMarketplaceAccount = useCallback(
    async (authority: string): Promise<MarketplaceAccount | null> => {
      try {
        const authorityPubkey = new PublicKey(authority);
        const [marketplacePDA] = getMarketplacePDA(authorityPubkey);

        const accountInfo = await connection.getAccountInfo(marketplacePDA);
        if (!accountInfo) {
          return null;
        }

        // In a real implementation, you would deserialize the account data
        // For now, return a mock structure
        return {
          isInitialized: true,
          authority: authorityPubkey,
          feePercentage: 250, // 2.5%
          feeRecipient: authorityPubkey,
          totalVolume: BigInt(0),
          totalSales: BigInt(0),
        };
      } catch (err) {
        handleError(err, "get marketplace account");
        return null;
      }
    },
    [connection, handleError]
  );

  const getListingAccount = useCallback(
    async (nftMint: string, seller: string): Promise<ListingAccount | null> => {
      try {
        const nftMintPubkey = new PublicKey(nftMint);
        const sellerPubkey = new PublicKey(seller);
        const [listingPDA] = getListingPDA(nftMintPubkey, sellerPubkey);

        const accountInfo = await connection.getAccountInfo(listingPDA);
        if (!accountInfo) {
          return null;
        }

        // In a real implementation, you would deserialize the account data
        // For now, return a mock structure
        return {
          isInitialized: true,
          seller: sellerPubkey,
          nftMint: nftMintPubkey,
          price: BigInt(1000000000), // 1 SOL in lamports
          createdAt: BigInt(Date.now()),
          marketplace: new PublicKey("11111111111111111111111111111111"),
        };
      } catch (err) {
        handleError(err, "get listing account");
        return null;
      }
    },
    [connection, handleError]
  );

  return {
    loading,
    error,
    initializeMarketplace,
    listNft,
    buyNft,
    cancelListing,
    updateMarketplaceFee,
    getMarketplaceAccount,
    getListingAccount,
    formatPrice,
    solToLamports,
  };
};
