import { BACKEND_CONFIG, API_ENDPOINTS } from "@/constants";
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
  ApiResponse,
} from "@/types";

// API Client Configuration
const API_BASE_URL = BACKEND_CONFIG.BASE_URL;

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: defaultHeaders,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Health Check
export const healthCheck = async (): Promise<
  ApiResponse<{ status: string }>
> => {
  return apiRequest(API_ENDPOINTS.HEALTH);
};

// NFT API functions
export const getNFTs = async (params?: {
  page?: number;
  limit?: number;
  collection_id?: string;
  owner?: string;
  verified?: boolean;
}): Promise<ApiResponse<PaginatedResponse<NFT>>> => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.collection_id)
    searchParams.append("collection_id", params.collection_id);
  if (params?.owner) searchParams.append("owner", params.owner);
  if (params?.verified !== undefined)
    searchParams.append("verified", params.verified.toString());

  const endpoint = `${API_ENDPOINTS.NFTS}?${searchParams.toString()}`;
  return apiRequest(endpoint);
};

export const getNFTDetails = async (
  mint: string
): Promise<ApiResponse<NFT>> => {
  return apiRequest(API_ENDPOINTS.NFT_DETAILS(mint));
};

export const getNFTActivities = async (
  mint: string,
  params?: { page?: number; limit?: number }
): Promise<ApiResponse<PaginatedResponse<Activity>>> => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());

  const endpoint = `${API_ENDPOINTS.NFT_ACTIVITIES(
    mint
  )}?${searchParams.toString()}`;
  return apiRequest(endpoint);
};

// Collection API functions
export const getCollections = async (params?: {
  page?: number;
  limit?: number;
  verified?: boolean;
}): Promise<ApiResponse<PaginatedResponse<Collection>>> => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.verified !== undefined)
    searchParams.append("verified", params.verified.toString());

  const endpoint = `${API_ENDPOINTS.COLLECTIONS}?${searchParams.toString()}`;
  return apiRequest(endpoint);
};

export const getCollectionDetails = async (
  id: string
): Promise<ApiResponse<Collection>> => {
  return apiRequest(API_ENDPOINTS.COLLECTION_DETAILS(id));
};

export const getCollectionNFTs = async (
  id: string,
  params?: { page?: number; limit?: number }
): Promise<ApiResponse<PaginatedResponse<NFT>>> => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());

  const endpoint = `${API_ENDPOINTS.COLLECTION_NFTS(
    id
  )}?${searchParams.toString()}`;
  return apiRequest(endpoint);
};

// Listing API functions
export const getListings = async (params?: {
  page?: number;
  limit?: number;
  collection_id?: string;
  seller?: string;
  min_price?: number;
  max_price?: number;
  currency?: "SOL" | "USDC";
}): Promise<ApiResponse<PaginatedResponse<Listing>>> => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.collection_id)
    searchParams.append("collection_id", params.collection_id);
  if (params?.seller) searchParams.append("seller", params.seller);
  if (params?.min_price)
    searchParams.append("min_price", params.min_price.toString());
  if (params?.max_price)
    searchParams.append("max_price", params.max_price.toString());
  if (params?.currency) searchParams.append("currency", params.currency);

  const endpoint = `${API_ENDPOINTS.LISTINGS}?${searchParams.toString()}`;
  return apiRequest(endpoint);
};

export const getListingDetails = async (
  id: string
): Promise<ApiResponse<Listing>> => {
  return apiRequest(API_ENDPOINTS.LISTING_DETAILS(id));
};

// Sales API functions
export const getSales = async (params?: {
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
}): Promise<ApiResponse<PaginatedResponse<Sale>>> => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.collection_id)
    searchParams.append("collection_id", params.collection_id);
  if (params?.seller) searchParams.append("seller", params.seller);
  if (params?.buyer) searchParams.append("buyer", params.buyer);
  if (params?.min_price)
    searchParams.append("min_price", params.min_price.toString());
  if (params?.max_price)
    searchParams.append("max_price", params.max_price.toString());
  if (params?.currency) searchParams.append("currency", params.currency);
  if (params?.start_date) searchParams.append("start_date", params.start_date);
  if (params?.end_date) searchParams.append("end_date", params.end_date);

  const endpoint = `${API_ENDPOINTS.SALES}?${searchParams.toString()}`;
  return apiRequest(endpoint);
};

// User API functions
export const getUserProfile = async (
  wallet: string
): Promise<ApiResponse<User>> => {
  return apiRequest(API_ENDPOINTS.USER_PROFILE(wallet));
};

export const createOrUpdateUserProfile = async (
  wallet: string,
  userData: Partial<User>
): Promise<ApiResponse<User>> => {
  return apiRequest(API_ENDPOINTS.USER_PROFILE(wallet), {
    method: "POST",
    body: JSON.stringify(userData),
  });
};

export const getUserFavorites = async (
  wallet: string,
  params?: { page?: number; limit?: number }
): Promise<ApiResponse<PaginatedResponse<NFT>>> => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());

  const endpoint = `${API_ENDPOINTS.USER_FAVORITES(
    wallet
  )}?${searchParams.toString()}`;
  return apiRequest(endpoint);
};

export const addFavoriteNFT = async (
  wallet: string,
  mint: string
): Promise<ApiResponse<{ success: boolean }>> => {
  return apiRequest(API_ENDPOINTS.USER_FAVORITES(wallet), {
    method: "POST",
    body: JSON.stringify({ nft_mint: mint }),
  });
};

export const removeFavoriteNFT = async (
  wallet: string,
  mint: string
): Promise<ApiResponse<{ success: boolean }>> => {
  return apiRequest(API_ENDPOINTS.USER_FAVORITE_NFT(wallet, mint), {
    method: "DELETE",
  });
};

// Statistics API functions
export const getMarketplaceStats = async (): Promise<
  ApiResponse<MarketplaceStats>
> => {
  return apiRequest(API_ENDPOINTS.STATS);
};

export const getDailyStats = async (params?: {
  days?: number;
  start_date?: string;
  end_date?: string;
}): Promise<ApiResponse<DailyStats[]>> => {
  const searchParams = new URLSearchParams();
  if (params?.days) searchParams.append("days", params.days.toString());
  if (params?.start_date) searchParams.append("start_date", params.start_date);
  if (params?.end_date) searchParams.append("end_date", params.end_date);

  const endpoint = `${API_ENDPOINTS.STATS_DAILY}?${searchParams.toString()}`;
  return apiRequest(endpoint);
};

// Search API functions
export const searchMarketplace = async (
  query: string,
  params?: {
    page?: number;
    limit?: number;
    type?: "nfts" | "collections" | "users";
  }
): Promise<
  ApiResponse<{
    nfts: NFT[];
    collections: Collection[];
    users: User[];
  }>
> => {
  const searchParams = new URLSearchParams();
  searchParams.append("q", query);
  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.type) searchParams.append("type", params.type);

  const endpoint = `${API_ENDPOINTS.SEARCH}?${searchParams.toString()}`;
  return apiRequest(endpoint);
};

// Export all functions as a single API object
export const api = {
  health: {
    check: healthCheck,
  },
  nfts: {
    list: getNFTs,
    get: getNFTDetails,
    getActivities: getNFTActivities,
  },
  collections: {
    list: getCollections,
    get: getCollectionDetails,
    getNFTs: getCollectionNFTs,
  },
  listings: {
    list: getListings,
    get: getListingDetails,
  },
  sales: {
    list: getSales,
  },
  users: {
    get: getUserProfile,
    createOrUpdate: createOrUpdateUserProfile,
    getFavorites: getUserFavorites,
    addFavorite: addFavoriteNFT,
    removeFavorite: removeFavoriteNFT,
  },
  stats: {
    getMarketplace: getMarketplaceStats,
    getDaily: getDailyStats,
  },
  search: searchMarketplace,
};
