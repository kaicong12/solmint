import { useState, useEffect, useCallback } from "react";
import { useWallet } from "./useWallet";
import { api } from "@/lib/api/client";
import {
  NFT,
  Collection,
  Listing,
  Sale,
  Activity,
  User,
  MarketplaceStats,
  DailyStats,
  PaginatedResponse,
} from "@/types";

export interface UseBackendApiReturn {
  // Loading states
  loading: boolean;
  error: string | null;

  // NFT functions
  nfts: NFT[];
  loadNFTs: (params?: {
    page?: number;
    limit?: number;
    collection_id?: string;
    owner?: string;
    verified?: boolean;
  }) => Promise<void>;
  getNFTDetails: (mint: string) => Promise<NFT | null>;
  getNFTActivities: (mint: string) => Promise<Activity[]>;

  // Collection functions
  collections: Collection[];
  loadCollections: (params?: {
    page?: number;
    limit?: number;
    verified?: boolean;
  }) => Promise<void>;
  getCollectionDetails: (id: string) => Promise<Collection | null>;
  getCollectionNFTs: (id: string) => Promise<NFT[]>;

  // Listing functions
  listings: Listing[];
  loadListings: (params?: {
    page?: number;
    limit?: number;
    collection_id?: string;
    seller?: string;
    min_price?: number;
    max_price?: number;
    currency?: "SOL" | "USDC";
  }) => Promise<void>;
  getListingDetails: (id: string) => Promise<Listing | null>;

  // Sales functions
  sales: Sale[];
  loadSales: (params?: {
    page?: number;
    limit?: number;
    collection_id?: string;
    seller?: string;
    buyer?: string;
    min_price?: number;
    max_price?: number;
    currency?: "SOL" | "USDC";
    start_date?: string;
    end_date?: string;
  }) => Promise<void>;

  // User functions
  userProfile: User | null;
  loadUserProfile: (wallet?: string) => Promise<void>;
  updateUserProfile: (userData: Partial<User>) => Promise<void>;
  userFavorites: NFT[];
  loadUserFavorites: () => Promise<void>;
  addToFavorites: (mint: string) => Promise<void>;
  removeFromFavorites: (mint: string) => Promise<void>;

  // Statistics functions
  marketplaceStats: MarketplaceStats | null;
  dailyStats: DailyStats[];
  loadMarketplaceStats: () => Promise<void>;
  loadDailyStats: (days?: number) => Promise<void>;

  // Search function
  searchResults: {
    nfts: NFT[];
    collections: Collection[];
    users: User[];
  } | null;
  searchMarketplace: (query: string) => Promise<void>;

  // Health check
  checkHealth: () => Promise<boolean>;

  // Pagination info
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const useBackendApi = (): UseBackendApiReturn => {
  const { publicKey } = useWallet();

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [userFavorites, setUserFavorites] = useState<NFT[]>([]);
  const [marketplaceStats, setMarketplaceStats] =
    useState<MarketplaceStats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [searchResults, setSearchResults] = useState<{
    nfts: NFT[];
    collections: Collection[];
    users: User[];
  } | null>(null);

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Error handler
  const handleError = useCallback((err: string, operation: string) => {
    console.error(`Error in ${operation}:`, err);
    setError(`Failed to ${operation}: ${err}`);
  }, []);

  // Generic loading wrapper
  const withLoading = useCallback(
    async <T>(
      operation: () => Promise<T>,
      operationName: string
    ): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);
        return await operation();
      } catch (err) {
        handleError(
          err instanceof Error ? err.message : "Unknown error",
          operationName
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [handleError]
  );

  // NFT functions
  const loadNFTs = useCallback(
    async (params?: {
      page?: number;
      limit?: number;
      collection_id?: string;
      owner?: string;
      verified?: boolean;
    }) => {
      await withLoading(async () => {
        const response = await api.nfts.list(params);
        if (response.success && response.data) {
          setNfts(response.data.data);
          setPagination({
            page: response.data.page,
            limit: response.data.limit,
            total: response.data.total,
            hasNext: response.data.has_next,
            hasPrev: response.data.has_prev,
          });
        } else {
          throw new Error(response.error || "Failed to load NFTs");
        }
      }, "load NFTs");
    },
    [withLoading]
  );

  const getNFTDetails = useCallback(
    async (mint: string): Promise<NFT | null> => {
      return withLoading(async () => {
        const response = await api.nfts.get(mint);
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.error || "Failed to get NFT details");
        }
      }, "get NFT details");
    },
    [withLoading]
  );

  const getNFTActivities = useCallback(
    async (mint: string): Promise<Activity[]> => {
      const result = await withLoading(async () => {
        const response = await api.nfts.getActivities(mint);
        if (response.success && response.data) {
          return response.data.data;
        } else {
          throw new Error(response.error || "Failed to get NFT activities");
        }
      }, "get NFT activities");
      return result || [];
    },
    [withLoading]
  );

  // Collection functions
  const loadCollections = useCallback(
    async (params?: { page?: number; limit?: number; verified?: boolean }) => {
      await withLoading(async () => {
        const response = await api.collections.list(params);
        if (response.success && response.data) {
          setCollections(response.data.data);
          setPagination({
            page: response.data.page,
            limit: response.data.limit,
            total: response.data.total,
            hasNext: response.data.has_next,
            hasPrev: response.data.has_prev,
          });
        } else {
          throw new Error(response.error || "Failed to load collections");
        }
      }, "load collections");
    },
    [withLoading]
  );

  const getCollectionDetails = useCallback(
    async (id: string): Promise<Collection | null> => {
      return withLoading(async () => {
        const response = await api.collections.get(id);
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.error || "Failed to get collection details");
        }
      }, "get collection details");
    },
    [withLoading]
  );

  const getCollectionNFTs = useCallback(
    async (id: string): Promise<NFT[]> => {
      const result = await withLoading(async () => {
        const response = await api.collections.getNFTs(id);
        if (response.success && response.data) {
          return response.data.data;
        } else {
          throw new Error(response.error || "Failed to get collection NFTs");
        }
      }, "get collection NFTs");
      return result || [];
    },
    [withLoading]
  );

  // Listing functions
  const loadListings = useCallback(
    async (params?: {
      page?: number;
      limit?: number;
      collection_id?: string;
      seller?: string;
      min_price?: number;
      max_price?: number;
      currency?: "SOL" | "USDC";
    }) => {
      await withLoading(async () => {
        const response = await api.listings.list(params);
        if (response.success && response.data) {
          setListings(response.data.data);
          setPagination({
            page: response.data.page,
            limit: response.data.limit,
            total: response.data.total,
            hasNext: response.data.has_next,
            hasPrev: response.data.has_prev,
          });
        } else {
          throw new Error(response.error || "Failed to load listings");
        }
      }, "load listings");
    },
    [withLoading]
  );

  const getListingDetails = useCallback(
    async (id: string): Promise<Listing | null> => {
      return withLoading(async () => {
        const response = await api.listings.get(id);
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.error || "Failed to get listing details");
        }
      }, "get listing details");
    },
    [withLoading]
  );

  // Sales functions
  const loadSales = useCallback(
    async (params?: {
      page?: number;
      limit?: number;
      collection_id?: string;
      seller?: string;
      buyer?: string;
      min_price?: number;
      max_price?: number;
      currency?: "SOL" | "USDC";
      start_date?: string;
      end_date?: string;
    }) => {
      await withLoading(async () => {
        const response = await api.sales.list(params);
        if (response.success && response.data) {
          setSales(response.data.data);
          setPagination({
            page: response.data.page,
            limit: response.data.limit,
            total: response.data.total,
            hasNext: response.data.has_next,
            hasPrev: response.data.has_prev,
          });
        } else {
          throw new Error(response.error || "Failed to load sales");
        }
      }, "load sales");
    },
    [withLoading]
  );

  // User functions
  const loadUserProfile = useCallback(
    async (wallet?: string) => {
      const walletAddress = wallet || publicKey?.toBase58();
      if (!walletAddress) return;

      await withLoading(async () => {
        const response = await api.users.get(walletAddress);
        if (response.success && response.data) {
          setUserProfile(response.data);
        } else {
          // User might not exist yet, that's okay
          setUserProfile(null);
        }
      }, "load user profile");
    },
    [publicKey, withLoading]
  );

  const updateUserProfile = useCallback(
    async (userData: Partial<User>) => {
      const walletAddress = publicKey?.toBase58();
      if (!walletAddress) return;

      await withLoading(async () => {
        const response = await api.users.createOrUpdate(
          walletAddress,
          userData
        );
        if (response.success && response.data) {
          setUserProfile(response.data);
        } else {
          throw new Error(response.error || "Failed to update user profile");
        }
      }, "update user profile");
    },
    [publicKey, withLoading]
  );

  const loadUserFavorites = useCallback(async () => {
    const walletAddress = publicKey?.toBase58();
    if (!walletAddress) return;

    await withLoading(async () => {
      const response = await api.users.getFavorites(walletAddress);
      if (response.success && response.data) {
        setUserFavorites(response.data.data);
      } else {
        throw new Error(response.error || "Failed to load user favorites");
      }
    }, "load user favorites");
  }, [publicKey, withLoading]);

  const addToFavorites = useCallback(
    async (mint: string) => {
      const walletAddress = publicKey?.toBase58();
      if (!walletAddress) return;

      await withLoading(async () => {
        const response = await api.users.addFavorite(walletAddress, mint);
        if (response.success) {
          // Reload favorites
          await loadUserFavorites();
        } else {
          throw new Error(response.error || "Failed to add to favorites");
        }
      }, "add to favorites");
    },
    [publicKey, withLoading, loadUserFavorites]
  );

  const removeFromFavorites = useCallback(
    async (mint: string) => {
      const walletAddress = publicKey?.toBase58();
      if (!walletAddress) return;

      await withLoading(async () => {
        const response = await api.users.removeFavorite(walletAddress, mint);
        if (response.success) {
          // Reload favorites
          await loadUserFavorites();
        } else {
          throw new Error(response.error || "Failed to remove from favorites");
        }
      }, "remove from favorites");
    },
    [publicKey, withLoading, loadUserFavorites]
  );

  // Statistics functions
  const loadMarketplaceStats = useCallback(async () => {
    await withLoading(async () => {
      const response = await api.stats.getMarketplace();
      if (response.success && response.data) {
        setMarketplaceStats(response.data);
      } else {
        throw new Error(response.error || "Failed to load marketplace stats");
      }
    }, "load marketplace stats");
  }, [withLoading]);

  const loadDailyStats = useCallback(
    async (days: number = 30) => {
      await withLoading(async () => {
        const response = await api.stats.getDaily({ days });
        if (response.success && response.data) {
          setDailyStats(response.data);
        } else {
          throw new Error(response.error || "Failed to load daily stats");
        }
      }, "load daily stats");
    },
    [withLoading]
  );

  // Search function
  const searchMarketplace = useCallback(
    async (query: string) => {
      await withLoading(async () => {
        const response = await api.search(query);
        if (response.success && response.data) {
          setSearchResults(response.data);
        } else {
          throw new Error(response.error || "Failed to search marketplace");
        }
      }, "search marketplace");
    },
    [withLoading]
  );

  // Health check
  const checkHealth = useCallback(async (): Promise<boolean> => {
    const result = await withLoading(async () => {
      const response = await api.health.check();
      return response.success;
    }, "check health");
    return result || false;
  }, [withLoading]);

  // Auto-load user profile and favorites when wallet connects
  useEffect(() => {
    if (publicKey) {
      loadUserProfile();
      loadUserFavorites();
    } else {
      setUserProfile(null);
      setUserFavorites([]);
    }
  }, [publicKey, loadUserProfile, loadUserFavorites]);

  return {
    // Loading states
    loading,
    error,

    // NFT functions
    nfts,
    loadNFTs,
    getNFTDetails,
    getNFTActivities,

    // Collection functions
    collections,
    loadCollections,
    getCollectionDetails,
    getCollectionNFTs,

    // Listing functions
    listings,
    loadListings,
    getListingDetails,

    // Sales functions
    sales,
    loadSales,

    // User functions
    userProfile,
    loadUserProfile,
    updateUserProfile,
    userFavorites,
    loadUserFavorites,
    addToFavorites,
    removeFromFavorites,

    // Statistics functions
    marketplaceStats,
    dailyStats,
    loadMarketplaceStats,
    loadDailyStats,

    // Search function
    searchResults,
    searchMarketplace,

    // Health check
    checkHealth,

    // Pagination info
    pagination,
  };
};
