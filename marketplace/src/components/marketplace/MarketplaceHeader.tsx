"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  Button,
  Input,
  Space,
  Layout,
  Typography,
  Avatar,
  Badge,
  Menu,
  Flex,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  InfoCircleOutlined,
  UserOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { FeeModal } from "./FeeModal";
import { MarketplaceStatus } from "@/lib/solana/marketplace";

const { Header } = Layout;
const { Title, Text } = Typography;

interface MarketplaceHeaderProps {
  onSearch: (query: string) => void;
  marketplaceStatus: MarketplaceStatus;
}

export function MarketplaceHeader({
  onSearch,
  marketplaceStatus,
}: Readonly<MarketplaceHeaderProps>) {
  const { connected } = useWallet();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFeesModal, setShowFeesModal] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  return (
    <>
      <Header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          width: "100%",
          backgroundColor: "#fff",
          borderBottom: "1px solid #f0f0f0",
          padding: "0 24px",
          height: "auto",
        }}
      >
        <Flex justify="space-between" align="center" style={{ height: "64px" }}>
          {/* Left side - Logo and Navigation */}
          <Flex align="center" gap={32}>
            {/* Logo */}
            <Flex align="center" gap={12}>
              <Avatar
                size={40}
                style={{
                  backgroundColor: "#722ed1",
                  fontSize: "18px",
                  fontWeight: "bold",
                }}
              >
                N
              </Avatar>
              <Title
                level={4}
                style={{
                  margin: 0,
                  color: "#262626",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                NFTMarket
              </Title>
            </Flex>

            {/* Navigation */}
            <Menu
              mode="horizontal"
              selectedKeys={["marketplace"]}
              style={{
                border: "none",
                backgroundColor: "transparent",
                minWidth: "300px",
              }}
              items={[
                {
                  key: "marketplace",
                  label: "Marketplace",
                },
                {
                  key: "collections",
                  label: "Collections",
                },
                {
                  key: "my-nfts",
                  label: "My NFTs",
                },
              ]}
            />
          </Flex>

          {/* Center - Search */}
          <div style={{ flex: 1, maxWidth: "400px", margin: "0 32px" }}>
            <Input
              placeholder="Search NFTs, collections, creators..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={handleSearchChange}
              size="large"
            />
          </div>

          {/* Right side - Actions and Wallet */}
          <Space size="middle">
            {/* Fees Button */}
            <Button
              type="text"
              icon={<InfoCircleOutlined />}
              onClick={() => setShowFeesModal(true)}
            >
              Fees
            </Button>

            {/* Create Button */}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{
                backgroundColor: "#722ed1",
                borderColor: "#722ed1",
              }}
            >
              Create
            </Button>

            {/* Wallet Connection */}
            {isClient && (
              <Space style={{ minWidth: "260px" }}>
                {connected ? (
                  <Space>
                    <Badge status="success" text="Connected" />
                    <WalletMultiButton
                      style={{ marginTop: "10px", backgroundColor: "#ff4d4f" }}
                    />
                  </Space>
                ) : (
                  <WalletMultiButton style={{ backgroundColor: "#722ed1" }} />
                )}
              </Space>
            )}
          </Space>
        </Flex>
      </Header>

      {/* Fees Modal */}
      <FeeModal
        open={showFeesModal}
        onCancel={() => setShowFeesModal(false)}
        marketplaceAccount={marketplaceStatus.marketplaceAccount}
        isLoading={marketplaceStatus.isLoading}
        error={marketplaceStatus.error}
      />
    </>
  );
}
