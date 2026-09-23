import type { NextConfig } from "next";
import { missingEnv } from "./lib/env";

// Gagal cepat saat build kalau ada env wajib yang belum di-set atau isinya
// cuma whitespace/BOM. Tanpa ini, deploy Vercel baru meledak belakangan
// dengan pesan samar ("Failed to collect page data" / TypeError ByteString)
// — yang butuh berjam-jam buat dilacak. Dijalankan hanya saat build.
if (process.env.NODE_ENV === "production") {
  const missing = missingEnv();
  if (missing.length > 0) {
    throw new Error(
      `Env wajib belum di-set/kosong di environment ini: ${missing.join(", ")}.\n` +
        `Set di Vercel → Project → Settings → Environment Variables, lalu redeploy.\n` +
        `Tips: ketik manual, jangan paste dari Word/Notepad (bisa membawa BOM).`,
    );
  }
}

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "26.154.58.203",
    "192.168.100.*",
    "*.trycloudflare.com",
  ],
  devIndicators: false,
  // Library ini lebih baik tidak di-bundle: ukurannya besar dan Prisma butuh
  // engine native-nya utuh di runtime Lambda Vercel.
  serverExternalPackages: [
    "puppeteer-core",
    "@sparticuz/chromium",
    "@prisma/client",
    ".prisma/client",
  ],
  // lib/pdf-logbook.ts baca templates/*.html|png via fs saat runtime — tanpa ini
  // file-nya tidak ikut ke trace serverless Vercel → ENOENT di production.
  outputFileTracingIncludes: {
    "/*": ["./templates/**/*"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
