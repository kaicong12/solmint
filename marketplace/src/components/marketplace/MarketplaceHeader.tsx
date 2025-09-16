"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  Button,
  Input,
  Modal,
  Typography,
  Space,
  Divider,
  Card,
  Row,
  Col,
  List,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  InfoCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface MarketplaceHeaderProps {
  onSearch: (query: string) => void;
}

export function MarketplaceHeader({ onSearch }: MarketplaceHeaderProps) {
  const { connected } = useWallet();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFeesModal, setShowFeesModal] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-xl font-bold text-white">N</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">NFTMarket</h1>
                <p className="text-xs text-gray-500">Solana Marketplace</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <a
                href="#"
                className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium"
              >
                Marketplace
              </a>
              <a
                href="#"
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
              >
                Collections
              </a>
              <a
                href="#"
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
              >
                My NFTs
              </a>
            </nav>
          </div>

          {/* Center - Search */}
          <div className="flex-1 max-w-lg mx-8">
            <Input
              placeholder="Search NFTs, collections, creators..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={handleSearchChange}
              size="large"
              style={{ borderRadius: "8px" }}
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
                backgroundColor: "#9333ea",
                borderColor: "#9333ea",
                borderRadius: "8px",
              }}
            >
              Create
            </Button>

            {/* Balance Display */}
            {connected && (
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">Balance</div>
                <div className="text-sm text-gray-500">12.47 SOL</div>
              </div>
            )}

            {/* Wallet Connection */}
            <div className="flex items-center space-x-2">
              {connected ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">
                      Connected
                    </span>
                  </div>
                  <WalletMultiButton className="!bg-red-600 !rounded-lg !font-medium !text-sm hover:!bg-red-700" />
                </div>
              ) : (
                <WalletMultiButton className="!bg-purple-600 !rounded-lg !font-medium !text-sm" />
              )}
            </div>

            {/* User Avatar/Menu */}
            {connected && (
              <Button
                type="text"
                shape="circle"
                icon={<UserOutlined />}
                style={{ backgroundColor: "#e5e7eb" }}
              />
            )}
          </Space>
        </div>
      </div>

      {/* Fees Modal */}
      <Modal
        title="Marketplace Fees"
        open={showFeesModal}
        onCancel={() => setShowFeesModal(false)}
        footer={null}
        width={500}
        style={{ top: 20 }}
        styles={{
          body: {
            maxHeight: "calc(100vh - 200px)",
            overflowY: "auto",
            padding: "16px",
          },
        }}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* Purchase Example */}
          <div>
            <Title level={4}>Example: 10 SOL NFT Purchase</Title>
            <Card size="small">
              <Row justify="space-between">
                <Text type="secondary">NFT Price</Text>
                <Text strong>10.0000 SOL</Text>
              </Row>
              <Row justify="space-between">
                <Text type="secondary">Buyer Fee (2.5%)</Text>
                <Text strong>+0.2500 SOL</Text>
              </Row>
              <Row justify="space-between">
                <Text type="secondary">Network Fee</Text>
                <Text strong>+0.0000 SOL</Text>
              </Row>
              <Divider style={{ margin: "8px 0" }} />
              <Row justify="space-between">
                <Text strong>Total Cost</Text>
                <Text strong>10.2500 SOL</Text>
              </Row>
            </Card>
          </div>

          {/* Listing & Creation */}
          <div>
            <Title level={4}>Listing & Creation</Title>
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small">
                  <Title level={5}>Listing Fee</Title>
                  <Title level={2} style={{ margin: "8px 0" }}>
                    0.01 SOL
                  </Title>
                  <Text type="secondary">
                    One-time fee to list your NFT for sale. Covers metadata
                    storage and indexing.
                  </Text>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Title level={5}>Network Fee</Title>
                  <Title level={2} style={{ margin: "8px 0" }}>
                    ~0.000005 SOL
                  </Title>
                  <Text type="secondary">
                    Solana blockchain transaction fee. Varies based on network
                    congestion.
                  </Text>
                </Card>
              </Col>
            </Row>
          </div>

          {/* Why These Fees */}
          <div>
            <Title level={4}>Why These Fees?</Title>
            <List
              size="small"
              dataSource={[
                {
                  title: "Platform Development",
                  desc: "Continuous improvement and new features",
                },
                {
                  title: "Security & Reliability",
                  desc: "Robust infrastructure and security measures",
                },
                {
                  title: "Creator Support",
                  desc: "Tools and resources for NFT creators",
                },
                {
                  title: "Community Growth",
                  desc: "Marketing and ecosystem development",
                },
              ]}
              renderItem={(item) => (
                <List.Item style={{ padding: "8px 0" }}>
                  <Text type="secondary">
                    • <Text strong>{item.title}:</Text> {item.desc}
                  </Text>
                </List.Item>
              )}
            />
          </div>
        </Space>
      </Modal>
    </header>
  );
}
