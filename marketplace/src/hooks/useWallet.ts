"use client";

import {
  useWallet as useSolanaWallet,
  useConnection,
} from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useState } from "react";
import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { getWalletBalance, parseWalletError } from "@/lib/solana/wallet";
import { confirmTransaction } from "@/lib/solana/connection";
import { TransactionResult } from "@/types";
import { ERROR_MESSAGES } from "@/constants";

export function useWallet() {
  const { connection } = useConnection();
  const wallet = useSolanaWallet();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Fetch wallet balance
  const fetchBalance = useCallback(async () => {
    if (!wallet.publicKey) {
      setBalance(0);
      return;
    }

    try {
      const newBalance = await getWalletBalance(wallet.publicKey, connection);
      setBalance(newBalance);
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      setBalance(0);
    }
  }, [wallet.publicKey, connection]);

  // Update balance when wallet connects/disconnects
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Send and confirm transaction
  const sendTransaction = useCallback(
    async (
      transaction: Transaction | VersionedTransaction
    ): Promise<TransactionResult> => {
      if (!wallet.connected || !wallet.publicKey) {
        return {
          success: false,
          error: ERROR_MESSAGES.WALLET_NOT_CONNECTED,
        };
      }

      if (!wallet.signTransaction) {
        return {
          success: false,
          error: "Wallet does not support transaction signing",
        };
      }

      setLoading(true);

      try {
        // Sign the transaction
        const signedTransaction = await wallet.signTransaction(transaction);

        // Send the transaction
        const signature = await connection.sendRawTransaction(
          signedTransaction.serialize()
        );

        // Confirm the transaction
        const confirmed = await confirmTransaction(
          signature,
          "confirmed",
          connection
        );

        if (confirmed) {
          // Refresh balance after successful transaction
          await fetchBalance();

          return {
            success: true,
            signature,
          };
        } else {
          return {
            success: false,
            error: "Transaction failed to confirm",
          };
        }
      } catch (error) {
        console.error("Transaction failed:", error);
        return {
          success: false,
          error: parseWalletError(error),
        };
      } finally {
        setLoading(false);
      }
    },
    [wallet, connection, fetchBalance]
  );

  // Send multiple transactions
  const sendTransactions = useCallback(
    async (
      transactions: (Transaction | VersionedTransaction)[]
    ): Promise<TransactionResult[]> => {
      if (!wallet.connected || !wallet.publicKey) {
        return transactions.map(() => ({
          success: false,
          error: ERROR_MESSAGES.WALLET_NOT_CONNECTED,
        }));
      }

      if (!wallet.signAllTransactions) {
        return transactions.map(() => ({
          success: false,
          error: "Wallet does not support batch transaction signing",
        }));
      }

      setLoading(true);

      try {
        // Sign all transactions
        const signedTransactions = await wallet.signAllTransactions(
          transactions
        );

        // Send all transactions
        const results: TransactionResult[] = [];

        for (const signedTransaction of signedTransactions) {
          try {
            const signature = await connection.sendRawTransaction(
              signedTransaction.serialize()
            );

            const confirmed = await confirmTransaction(
              signature,
              "confirmed",
              connection
            );

            results.push({
              success: confirmed,
              signature: confirmed ? signature : undefined,
              error: confirmed ? undefined : "Transaction failed to confirm",
            });
          } catch (error) {
            results.push({
              success: false,
              error: parseWalletError(error),
            });
          }
        }

        // Refresh balance after transactions
        await fetchBalance();

        return results;
      } catch (error) {
        console.error("Batch transaction failed:", error);
        return transactions.map(() => ({
          success: false,
          error: parseWalletError(error),
        }));
      } finally {
        setLoading(false);
      }
    },
    [wallet, connection, fetchBalance]
  );

  // Check if address is current wallet
  const isOwnAddress = useCallback(
    (address: string | PublicKey): boolean => {
      if (!wallet.publicKey) return false;

      const addressKey =
        typeof address === "string" ? new PublicKey(address) : address;
      return wallet.publicKey.equals(addressKey);
    },
    [wallet.publicKey]
  );

  return {
    // Wallet state
    ...wallet,
    balance,
    loading,

    // Actions
    sendTransaction,
    sendTransactions,
    fetchBalance,
    isOwnAddress,

    // Utilities
    connection,
  };
}
