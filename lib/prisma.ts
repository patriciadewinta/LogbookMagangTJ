import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function buildClient() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL belum di-set.");

  const url = new URL(raw);
  // Jalur runtime wajib lewat transaction pooler Supabase (port 6543,
  // pgbouncer=true). Di sana koneksi cuma dipegang selama satu transaksi,
  // jadi banyak instance lambda bisa berbagi slot yang sama. connection_limit=1
  // berarti tiap instance cukup ambil satu koneksi. Fallback di bawah cuma
  // jaring pengaman kalau param-nya lupa dicantumkan di env — default Prisma
  // (num_cpus*2+1 per instance) langsung menghabiskan pool_size 15 milik
  // Supabase dan memicu EMAXCONNSESSION.
  if (!url.searchParams.has("connection_limit")) {
    url.searchParams.set("connection_limit", "1");
  }
  if (!url.searchParams.has("pool_timeout")) {
    url.searchParams.set("pool_timeout", "20");
  }
  return new PrismaClient({ datasourceUrl: url.toString() });
}

export const prisma = globalForPrisma.prisma ?? buildClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
