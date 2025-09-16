"use client";

import { useState } from "react";
import { Collection } from "@/types";
import { Checkbox, Slider, Collapse, Typography, Space } from "antd";
import { FilterOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface MarketplaceSidebarProps {
  collections: Collection[];
  onCollectionFilter: (collectionIds: string[]) => void;
  onPriceFilter: (min: number, max: number) => void;
  onStatusFilter: (statuses: string[]) => void;
}

export function MarketplaceSidebar({
  collections,
  onCollectionFilter,
  onPriceFilter,
  onStatusFilter,
}: Readonly<MarketplaceSidebarProps>) {
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 20 });
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const handleCollectionChange = (collectionId: string, checked: boolean) => {
    const newSelected = checked
      ? [...selectedCollections, collectionId]
      : selectedCollections.filter((id) => id !== collectionId);

    setSelectedCollections(newSelected);
    onCollectionFilter(newSelected);
  };

  const handlePriceChange = (min: number, max: number) => {
    setPriceRange({ min, max });
    onPriceFilter(min, max);
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    const newSelected = checked
      ? [...selectedStatuses, status]
      : selectedStatuses.filter((s) => s !== status);

    setSelectedStatuses(newSelected);
    onStatusFilter(newSelected);
  };

  const mockCollections = [
    { id: "cyber-punks", name: "cyber-punks" },
    { id: "abstract-worlds", name: "abstract-worlds" },
    { id: "geometric-dreams", name: "geometric-dreams" },
  ];

  const allCollections = [...collections.slice(0, 5), ...mockCollections];

  return (
    <div style={{ padding: "24px" }}>
      {/* Filters Header */}
      <Space align="center" style={{ marginBottom: 24 }}>
        <FilterOutlined style={{ color: "#6b7280" }} />
        <Title level={4} style={{ margin: 0 }}>
          Filters
        </Title>
      </Space>

      <Collapse
        defaultActiveKey={["collections", "priceRange", "status"]}
        ghost
        size="small"
        items={[
          {
            key: "collections",
            label: "Collections",
            children: (
              <Space direction="vertical" style={{ width: "100%" }}>
                {allCollections.map((collection) => (
                  <Checkbox
                    key={collection.id}
                    checked={selectedCollections.includes(collection.id)}
                    onChange={(e) =>
                      handleCollectionChange(collection.id, e.target.checked)
                    }
                  >
                    {collection.name}
                  </Checkbox>
                ))}
              </Space>
            ),
          },
          {
            key: "priceRange",
            label: "Price Range (SOL)",
            children: (
              <Space direction="vertical" style={{ width: "100%" }}>
                <Slider
                  range
                  min={0}
                  max={20}
                  step={0.1}
                  value={[priceRange.min, priceRange.max]}
                  onChange={(value) => handlePriceChange(value[0], value[1])}
                  styles={{
                    track: { backgroundColor: "#9333ea" },
                    handle: { borderColor: "#9333ea" },
                  }}
                />
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Text type="secondary">{priceRange.min} SOL</Text>
                  <Text type="secondary">{priceRange.max} SOL</Text>
                </div>
              </Space>
            ),
          },
          {
            key: "status",
            label: "Status",
            children: (
              <Space direction="vertical">
                <Checkbox
                  checked={selectedStatuses.includes("listed")}
                  onChange={(e) =>
                    handleStatusChange("listed", e.target.checked)
                  }
                >
                  Listed for Sale
                </Checkbox>
                <Checkbox
                  checked={selectedStatuses.includes("auction")}
                  onChange={(e) =>
                    handleStatusChange("auction", e.target.checked)
                  }
                >
                  On Auction
                </Checkbox>
                <Checkbox
                  checked={selectedStatuses.includes("offers")}
                  onChange={(e) =>
                    handleStatusChange("offers", e.target.checked)
                  }
                >
                  Has Offers
                </Checkbox>
              </Space>
            ),
          },
          {
            key: "attributes",
            label: "Attributes",
            children: (
              <Text type="secondary">
                Select a collection to view attributes
              </Text>
            ),
          },
          {
            key: "rarity",
            label: "Rarity",
            children: (
              <Space direction="vertical">
                <Checkbox>Common</Checkbox>
                <Checkbox>Rare</Checkbox>
                <Checkbox>Epic</Checkbox>
                <Checkbox>Legendary</Checkbox>
              </Space>
            ),
          },
        ]}
      />
    </div>
  );
}
