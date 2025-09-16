"use client";

import { useMemo } from "react";
import {
  Modal,
  Typography,
  Space,
  Divider,
  Card,
  Row,
  List,
  Spin,
  Alert,
} from "antd";
import { MarketplaceAccount } from "@/lib/solana/program";

const { Title, Text } = Typography;

interface FeeModalProps {
  open: boolean;
  onCancel: () => void;
  marketplaceAccount: MarketplaceAccount | null;
  isLoading?: boolean;
  error?: string | null;
}

export function FeeModal({
  open,
  onCancel,
  marketplaceAccount,
  isLoading = false,
  error = null,
}: FeeModalProps) {
  // Calculate fees based on marketplace data
  const feeData = useMemo(() => {
    if (!marketplaceAccount) {
      return {
        feePercentage: 2.5, // Default fallback
        buyerFeeSOL: 0.25,
        listingFeeSOL: 0.01,
        networkFeeSOL: 0.000005,
      };
    }

    // Convert basis points to percentage (e.g., 250 basis points = 2.5%)
    const feePercentage = marketplaceAccount.feePercentage / 100;
    const examplePrice = 10; // 10 SOL example
    const buyerFeeSOL = (examplePrice * feePercentage) / 100;

    return {
      feePercentage,
      buyerFeeSOL,
      listingFeeSOL: 0.01, // Fixed listing fee
      networkFeeSOL: 0.000005, // Approximate Solana network fee
    };
  }, [marketplaceAccount]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin size="large" />
          <div style={{ marginTop: "16px" }}>
            <Text>Loading marketplace fee information...</Text>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <Alert
          message="Error Loading Fee Information"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: "16px" }}
        />
      );
    }

    return (
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Marketplace Status */}
        {marketplaceAccount && (
          <div>
            <Alert
              message="Live Marketplace Data"
              description={`Fee percentage: ${feeData.feePercentage}% (${marketplaceAccount.feePercentage} basis points)`}
              type="info"
              showIcon
              style={{ marginBottom: "16px" }}
            />
          </div>
        )}

        {/* Purchase Example */}
        <div>
          <Title level={4}>Example: 10 SOL NFT Purchase</Title>
          <Card size="small">
            <Row justify="space-between">
              <Text type="secondary">NFT Price</Text>
              <Text strong>10.0000 SOL</Text>
            </Row>
            <Row justify="space-between">
              <Text type="secondary">Buyer Fee ({feeData.feePercentage}%)</Text>
              <Text strong>+{feeData.buyerFeeSOL.toFixed(4)} SOL</Text>
            </Row>
            <Row justify="space-between">
              <Text type="secondary">Network Fee</Text>
              <Text strong>+{feeData.networkFeeSOL.toFixed(6)} SOL</Text>
            </Row>
            <Divider style={{ margin: "8px 0" }} />
            <Row justify="space-between">
              <Text strong>Total Cost</Text>
              <Text strong>
                {(10 + feeData.buyerFeeSOL + feeData.networkFeeSOL).toFixed(4)}{" "}
                SOL
              </Text>
            </Row>
          </Card>
        </div>

        {/* Seller Proceeds Example */}
        <div>
          <Title level={4}>Seller Proceeds (10 SOL Sale)</Title>
          <Card size="small">
            <Row justify="space-between">
              <Text type="secondary">Sale Price</Text>
              <Text strong>10.0000 SOL</Text>
            </Row>
            <Row justify="space-between">
              <Text type="secondary">
                Marketplace Fee ({feeData.feePercentage}%)
              </Text>
              <Text strong>-{feeData.buyerFeeSOL.toFixed(4)} SOL</Text>
            </Row>
            <Divider style={{ margin: "8px 0" }} />
            <Row justify="space-between">
              <Text strong>You Receive</Text>
              <Text strong style={{ color: "#52c41a" }}>
                {(10 - feeData.buyerFeeSOL).toFixed(4)} SOL
              </Text>
            </Row>
          </Card>
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

        {/* Fee Recipient Info */}
        {marketplaceAccount && (
          <div>
            <Title level={4}>Fee Information</Title>
            <Card size="small">
              <Space direction="vertical" style={{ width: "100%" }}>
                <Row justify="space-between">
                  <Text type="secondary">Fee Percentage</Text>
                  <Text strong>{feeData.feePercentage}%</Text>
                </Row>
                <Row justify="space-between">
                  <Text type="secondary">Basis Points</Text>
                  <Text strong>{marketplaceAccount.feePercentage}</Text>
                </Row>
                <Row justify="space-between">
                  <Text type="secondary">Fee Recipient</Text>
                  <Text
                    strong
                    style={{ fontSize: "12px", fontFamily: "monospace" }}
                  >
                    {marketplaceAccount.feeRecipient.toString().slice(0, 8)}...
                    {marketplaceAccount.feeRecipient.toString().slice(-8)}
                  </Text>
                </Row>
              </Space>
            </Card>
          </div>
        )}
      </Space>
    );
  };

  return (
    <Modal
      title="Marketplace Fees"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={600}
      style={{ top: 20 }}
      styles={{
        body: {
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
          padding: "16px",
        },
      }}
    >
      {renderContent()}
    </Modal>
  );
}
