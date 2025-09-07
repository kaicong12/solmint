import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Polyfills for browser environment
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        buffer: require.resolve("buffer"),
        process: require.resolve("process/browser"),
      };

      config.plugins.push(
        new config.webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          process: "process/browser",
        })
      );
    }

    // Handle ES modules
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };

    return config;
  },

  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ["@solana/web3.js", "@metaplex-foundation/js"],
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_SOLANA_NETWORK:
      process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet",
    NEXT_PUBLIC_RPC_ENDPOINT:
      process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://api.devnet.solana.com",
  },

  turbopack: {
    root: path.join(__dirname, ".."),
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
