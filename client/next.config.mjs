import path from "path";
import { fileURLToPath } from "url";
import withSerwistInit from "@serwist/next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@privy-io/react-auth"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.zerion.io", pathname: "/**" },
    ],
  },
  webpack: (config) => {
    config.resolve.alias = {
      "lucide-react": path.resolve(__dirname, "lucide-react-shim.mjs"),
      "lucide-react-real": path.resolve(__dirname, "node_modules/lucide-react"),
      "@farcaster/mini-app-solana": false,
      ...config.resolve.alias,
    };
    return config;
  },
};

export default withSerwist(nextConfig);
