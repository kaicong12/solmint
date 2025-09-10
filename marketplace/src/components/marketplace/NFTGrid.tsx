"use client";

import { useState } from "react";
import { NFT } from "@/types";

interface NFTGridProps {
  nfts: NFT[];
  loading: boolean;
}

interface MockNFT {
  id: string;
  name: string;
  collection: string;
  creator: string;
  creatorInitial: string;
  price: string;
  image: string;
  rarity?: string;
  status?: string;
  mint: string;
}

// Mock data to match the design
const mockNFTs: MockNFT[] = [
  {
    id: "1",
    name: "Cyber Warrior #1247",
    collection: "cyber-punks",
    creator: "CyberCreator",
    creatorInitial: "C",
    price: "4.5 SOL",
    image: "/api/placeholder/300/300",
    rarity: "Legendary",
    status: "active",
    mint: "Bb9J...K8mN",
  },
  {
    id: "2",
    name: "Abstract Dimension #892",
    collection: "abstract-worlds",
    creator: "AbstractArtist",
    creatorInitial: "A",
    price: "2.8 SOL",
    image: "/api/placeholder/300/300",
    status: "active",
    mint: "Cc8L...M9oP",
  },
  {
    id: "3",
    name: "Geometric Portal #156",
    collection: "geometric-dreams",
    creator: "GeometryMaster",
    creatorInitial: "G",
    price: "5.2 SOL",
    image: "/api/placeholder/300/300",
    status: "active",
    mint: "Dd7K...N8qR",
  },
  {
    id: "4",
    name: "Future Vision #2089",
    collection: "cyber-punks",
    creator: "FutureProphet",
    creatorInitial: "F",
    price: "3.7 SOL",
    rarity: "Epic",
    image: "/api/placeholder/300/300",
    status: "active",
    mint: "Ee6J...P7sT",
  },
  {
    id: "5",
    name: "Digital Dreams #445",
    collection: "abstract-worlds",
    creator: "DreamWeaver",
    creatorInitial: "D",
    price: "1.9 SOL",
    image: "/api/placeholder/300/300",
    status: "not_listed",
    mint: "Ff5I...Q6uV",
  },
  {
    id: "6",
    name: "Neon Genesis #778",
    collection: "geometric-dreams",
    creator: "NeonArtist",
    creatorInitial: "N",
    price: "6.1 SOL",
    image: "/api/placeholder/300/300",
    status: "active",
    mint: "Gg4H...R5wX",
  },
];

export function NFTGrid({ nfts, loading }: NFTGridProps) {
  const [favorites, setFavorites] = useState<string[]>([]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse"
          >
            <div className="w-full h-64 bg-gray-200"></div>
            <div className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4 w-2/3"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Use mock data for demo purposes
  const displayNFTs = mockNFTs;

  if (displayNFTs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No NFTs found
        </h3>
        <p className="text-gray-500">
          Try adjusting your search or filter criteria
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {displayNFTs.map((nft) => (
        <div
          key={nft.id}
          className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-200 border border-gray-100"
        >
          {/* NFT Image */}
          <div className="relative">
            <div className="w-full h-64 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
              <div className="text-white text-6xl font-bold opacity-20">
                NFT
              </div>
            </div>

            {/* Rarity Badge */}
            {nft.rarity && (
              <div className="absolute top-3 left-3">
                <span
                  className={`px-2 py-1 rounded-md text-xs font-medium text-white ${
                    nft.rarity === "Legendary"
                      ? "bg-yellow-500"
                      : nft.rarity === "Epic"
                      ? "bg-purple-500"
                      : "bg-blue-500"
                  }`}
                >
                  {nft.rarity}
                </span>
              </div>
            )}

            {/* Status Badge */}
            {nft.status === "not_listed" && (
              <div className="absolute top-3 left-3">
                <span className="px-2 py-1 rounded-md text-xs font-medium text-white bg-gray-600">
                  Not Listed
                </span>
              </div>
            )}

            {/* Favorite Button */}
            <button
              onClick={() => toggleFavorite(nft.id)}
              className="absolute top-3 right-3 w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all"
            >
              <svg
                className={`w-4 h-4 ${
                  favorites.includes(nft.id)
                    ? "text-red-500 fill-current"
                    : "text-white"
                }`}
                fill={favorites.includes(nft.id) ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          </div>

          {/* NFT Details */}
          <div className="p-4">
            {/* Title and Collection */}
            <div className="mb-3">
              <h3 className="font-semibold text-gray-900 text-lg mb-1">
                {nft.name}
              </h3>
              <p className="text-sm text-gray-500">{nft.collection}</p>
            </div>

            {/* Creator */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">
                    {nft.creatorInitial}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Created by</p>
                  <p className="text-sm font-medium text-gray-900">
                    {nft.creator}
                  </p>
                </div>
              </div>
            </div>

            {/* Price and Action */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-gray-500">Price</p>
                <p className="text-lg font-bold text-gray-900">{nft.price}</p>
              </div>
            </div>

            {/* Mint Address */}
            <div className="mb-4">
              <p className="text-xs text-gray-500">Mint</p>
              <p className="text-sm font-mono text-gray-700">{nft.mint}</p>
            </div>

            {/* Buy Button */}
            <button
              disabled={nft.status === "not_listed"}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                nft.status === "not_listed"
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-900 text-white hover:bg-gray-800"
              }`}
            >
              {nft.status === "not_listed" ? "Not Available" : "Buy Now"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
