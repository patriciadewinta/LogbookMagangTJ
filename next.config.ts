import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["26.154.58.203", "192.168.100.*"],
  devIndicators: false,
  serverExternalPackages: ["tesseract.js", "pdf-to-png-converter"],
};

export default nextConfig;
