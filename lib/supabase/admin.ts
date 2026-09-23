import { createClient, type User } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

// Cari user auth Supabase by email TANPA menarik semua user (listUsers 1000).
// Jalur utama: profile.email → id (auth user id) → getUserById (query by PK).
// Fallback listUsers hanya untuk akun lama yang profile.email-nya null
// (user yang pernah daftar manual sebelum kolom email diisi di profile).
export async function findAuthUserByEmail(email: string): Promise<User | null> {
  const admin = createAdminClient();
  const norm = email.trim().toLowerCase();

  const profile = await prisma.profile.findUnique({
    where: { email: norm },
    select: { id: true },
  });
  if (profile?.id) {
    const { data: byId } = await admin.auth.admin.getUserById(profile.id);
    if (byId.user?.email?.toLowerCase() === norm) return byId.user;
  }

  const { data: all } = await admin.auth.admin.listUsers({ perPage: 1000 });
  return all.users.find((u) => u.email?.toLowerCase() === norm) ?? null;
}
