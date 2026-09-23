import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function buildClient() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL belum di-set.");

  const url = new URL(raw);
  // Supabase PgBouncer session mode membatasi 15 koneksi total. Tanpa batas
  // eksplisit Prisma memakai default num_cpus*2+1 per lambda instance, dan
  // beberapa instance konkuren sudah cukup untuk kena EMAXCONNSESSION.
  if (!url.searchParams.has("connection_limit")) {
    url.searchParams.set("connection_limit", "5");
  }
  if (!url.searchParams.has("pool_timeout")) {
    url.searchParams.set("pool_timeout", "20");
  }
  return new PrismaClient({ datasourceUrl: url.toString() });
}

export const prisma = globalForPrisma.prisma ?? buildClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
