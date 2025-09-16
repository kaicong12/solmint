"use client";

import { useState } from "react";
import {
  Modal,
  Form,
  Input,
  Upload,
  Button,
  Space,
  Typography,
  message,
  Progress,
} from "antd";
import { UploadOutlined, PlusOutlined } from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd";
import { useWallet } from "@solana/wallet-adapter-react";
import { api } from "@/lib/api/client";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface CreateNFTModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
}

interface NFTFormData {
  name: string;
  symbol: string;
  description?: string;
  image: UploadFile[];
}

export function CreateNFTModal({
  open,
  onCancel,
  onSuccess,
}: CreateNFTModalProps) {
  const [form] = Form.useForm<NFTFormData>();
  const { publicKey, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<
    "form" | "uploading" | "minting" | "success"
  >("form");

  const handleSubmit = async (values: NFTFormData) => {
    if (!publicKey || !signTransaction) {
      message.error("Please connect your wallet first");
      return;
    }

    if (!values.image || values.image.length === 0) {
      message.error("Please select an image for your NFT");
      return;
    }

    setLoading(true);
    setCurrentStep("uploading");

    try {
      // Step 1: Get presigned URL for image upload
      const presignedResponse = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: values.image[0].name,
          contentType: values.image[0].type || "image/jpeg",
        }),
      });

      if (!presignedResponse.ok) {
        throw new Error("Failed to get presigned URL");
      }

      const { uploadUrl, imageUrl } = await presignedResponse.json();

      // Step 2: Upload image to S3
      setUploadProgress(25);
      const imageFile = values.image[0].originFileObj as File;

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: imageFile,
        headers: {
          "Content-Type": imageFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      setUploadProgress(50);
      setCurrentStep("minting");

      // Step 3: Create NFT metadata
      const metadata = {
        name: values.name,
        symbol: values.symbol,
        description: values.description || "",
        image: imageUrl,
        attributes: [],
        properties: {
          files: [
            {
              uri: imageUrl,
              type: imageFile.type,
            },
          ],
          category: "image",
        },
      };

      // Step 4: Upload metadata to get URI
      const metadataResponse = await fetch("/api/upload/metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ metadata }),
      });

      if (!metadataResponse.ok) {
        throw new Error("Failed to upload metadata");
      }

      const { metadataUri } = await metadataResponse.json();
      setUploadProgress(75);

      // Step 5: Mint NFT
      const mintResponse = await fetch("/api/nft/mint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          symbol: values.symbol,
          uri: metadataUri,
          creator: publicKey.toString(),
        }),
      });

      if (!mintResponse.ok) {
        throw new Error("Failed to create mint transaction");
      }

      const { transaction } = await mintResponse.json();

      // Step 6: Sign and send transaction
      const signedTransaction = await signTransaction(transaction);

      const sendResponse = await fetch("/api/nft/send-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signedTransaction: Array.from(signedTransaction.serialize()),
        }),
      });

      if (!sendResponse.ok) {
        throw new Error("Failed to send transaction");
      }

      setUploadProgress(100);
      setCurrentStep("success");

      message.success("NFT minted successfully!");

      // Reset form and close modal after a short delay
      setTimeout(() => {
        form.resetFields();
        setCurrentStep("form");
        setUploadProgress(0);
        onSuccess?.();
        onCancel();
      }, 2000);
    } catch (error) {
      console.error("Error minting NFT:", error);
      message.error("Failed to mint NFT. Please try again.");
      setCurrentStep("form");
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        message.error("You can only upload image files!");
        return false;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error("Image must be smaller than 10MB!");
        return false;
      }
      return false; // Prevent auto upload
    },
    maxCount: 1,
    listType: "picture-card",
    showUploadList: {
      showPreviewIcon: false,
      showRemoveIcon: true,
    },
  };

  const handleCancel = () => {
    if (loading) {
      message.warning("Please wait for the minting process to complete");
      return;
    }
    form.resetFields();
    setCurrentStep("form");
    setUploadProgress(0);
    onCancel();
  };

  const renderProgressContent = () => {
    switch (currentStep) {
      case "uploading":
        return (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Progress percent={uploadProgress} />
            <Text style={{ marginTop: 16, display: "block" }}>
              Uploading image and metadata...
            </Text>
          </div>
        );
      case "minting":
        return (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Progress percent={uploadProgress} />
            <Text style={{ marginTop: 16, display: "block" }}>
              Creating NFT transaction...
            </Text>
          </div>
        );
      case "success":
        return (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Progress percent={100} status="success" />
            <Text style={{ marginTop: 16, display: "block", color: "#52c41a" }}>
              NFT minted successfully! 🎉
            </Text>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      title={
        <Title level={4} style={{ margin: 0 }}>
          Create New NFT
        </Title>
      }
      open={open}
      onCancel={handleCancel}
      footer={
        currentStep === "form" ? (
          <Space>
            <Button onClick={handleCancel}>Cancel</Button>
            <Button
              type="primary"
              onClick={() => form.submit()}
              loading={loading}
              disabled={!publicKey}
              style={{
                backgroundColor: "#722ed1",
                borderColor: "#722ed1",
              }}
            >
              Mint NFT
            </Button>
          </Space>
        ) : null
      }
      width={600}
      destroyOnClose
      maskClosable={!loading}
      closable={!loading}
    >
      {currentStep === "form" ? (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="image"
            label="NFT Image"
            rules={[{ required: true, message: "Please upload an image" }]}
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e?.fileList;
            }}
          >
            <Upload {...uploadProps}>
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload Image</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item
            name="name"
            label="NFT Name"
            rules={[
              { required: true, message: "Please enter NFT name" },
              { max: 32, message: "Name must be 32 characters or less" },
            ]}
          >
            <Input placeholder="Enter NFT name" />
          </Form.Item>

          <Form.Item
            name="symbol"
            label="NFT Symbol"
            rules={[
              { required: true, message: "Please enter NFT symbol" },
              { max: 10, message: "Symbol must be 10 characters or less" },
            ]}
          >
            <Input placeholder="Enter NFT symbol (e.g., MYNFT)" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description (Optional)"
            rules={[
              {
                max: 500,
                message: "Description must be 500 characters or less",
              },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Describe your NFT..."
              showCount
              maxLength={500}
            />
          </Form.Item>

          {!publicKey && (
            <div
              style={{
                padding: 16,
                backgroundColor: "#fff7e6",
                border: "1px solid #ffd591",
                borderRadius: 6,
                marginBottom: 16,
              }}
            >
              <Text type="warning">
                Please connect your wallet to mint an NFT
              </Text>
            </div>
          )}
        </Form>
      ) : (
        renderProgressContent()
      )}
    </Modal>
  );
}
