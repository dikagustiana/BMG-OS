import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@bmg/engine", "@bmg/parsers"],
  serverExternalPackages: ["pdfmake"],
  outputFileTracingRoot: path.join(__dirname, "../.."),
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
  poweredByHeader: false,
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
