import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "26.154.58.203",
    "192.168.100.*",
    "*.trycloudflare.com",
  ],
  devIndicators: false,
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
  // lib/pdf-logbook.ts baca templates/*.html|png via fs saat runtime — tanpa ini
  // file-nya tidak ikut ke trace serverless Vercel → ENOENT di production.
  outputFileTracingIncludes: {
    "/*": ["./templates/**/*"],
  },
};

export default nextConfig;
