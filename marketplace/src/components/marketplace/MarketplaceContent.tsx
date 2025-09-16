"use client";

import { useState, useEffect } from "react";
import { MarketplaceHeader } from "./MarketplaceHeader";
import { MarketplaceSidebar } from "./MarketplaceSidebar";
import { NFTGrid } from "./NFTGrid";
import { api } from "@/lib/api/client";
import { NFT, Collection } from "@/types";
import { MarketplaceStatus } from "@/lib/solana/marketplace";
import { Typography, Statistic, Row, Col } from "antd";

const { Title, Paragraph } = Typography;

interface MarketplaceContentProps {
  marketplaceStatus: MarketplaceStatus;
}

export function MarketplaceContent({
  marketplaceStatus,
}: Readonly<MarketplaceContentProps>) {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load NFTs and collections
        const [nftsResponse, collectionsResponse] = await Promise.all([
          api.nfts.list({ limit: 50 }),
          api.collections.list({ limit: 20 }),
        ]);

        if (nftsResponse.success && nftsResponse.data) {
          setNfts(nftsResponse.data.data);
        }

        if (collectionsResponse.success && collectionsResponse.data) {
          setCollections(collectionsResponse.data.data);
        }
      } catch (error) {
        console.error("Failed to load marketplace data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter NFTs based on search and filters
  const filteredNfts = nfts.filter((nft) => {
    // Search filter
    if (
      searchQuery &&
      !nft.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Collection filter
    if (
      selectedCollections.length > 0 &&
      nft.collection_id &&
      !selectedCollections.includes(nft.collection_id)
    ) {
      return false;
    }

    return true;
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCollectionFilter = (collectionIds: string[]) => {
    setSelectedCollections(collectionIds);
  };

  const handlePriceFilter = () => {
    // Price filter functionality can be implemented when needed
  };

  const handleStatusFilter = () => {
    // Status filter functionality can be implemented when needed
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      {/* Header */}
      <MarketplaceHeader
        onSearch={handleSearch}
        marketplaceStatus={marketplaceStatus}
      />

      <div style={{ display: "flex" }}>
        {/* Sidebar */}
        <div
          style={{
            width: "280px",
            backgroundColor: "#fff",
            borderRight: "1px solid #f0f0f0",
            minHeight: "calc(100vh - 64px)",
            position: "sticky",
            top: "64px",
            overflow: "auto",
          }}
        >
          <MarketplaceSidebar
            collections={collections}
            onCollectionFilter={handleCollectionFilter}
            onPriceFilter={handlePriceFilter}
            onStatusFilter={handleStatusFilter}
          />
        </div>

        {/* Main Content */}
        <div
          style={{
            flex: 1,
            padding: "24px",
            backgroundColor: "#f5f5f5",
            minHeight: "calc(100vh - 64px)",
          }}
        >
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            {/* Page Header */}
            <div style={{ marginBottom: "32px" }}>
              <Title level={2} style={{ marginBottom: "8px" }}>
                Discover NFTs
              </Title>
              <Paragraph style={{ fontSize: "16px", color: "#8c8c8c" }}>
                Explore unique digital assets on Solana
              </Paragraph>

              {/* Statistics */}
              <Row gutter={16} style={{ marginTop: "16px" }}>
                <Col>
                  <Statistic
                    title="Total Items"
                    value={filteredNfts.length}
                    style={{ textAlign: "left" }}
                  />
                </Col>
                <Col>
                  <Statistic
                    title="Collections"
                    value={collections.length}
                    style={{ textAlign: "left" }}
                  />
                </Col>
              </Row>
            </div>

            {/* NFT Grid */}
            <NFTGrid nfts={filteredNfts} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}
