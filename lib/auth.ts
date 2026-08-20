import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileForUser } from "@/lib/profile";

// Verifikasi JWT lokal via JWKS yang di-cache — tanpa round-trip ke server
// Supabase Auth di setiap request (beda dengan getUser()). cache() mendedupe
// verifikasi antar pemanggil dalam satu request.
export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims =
    (data && "claims" in data ? data.claims : data) ??
    null;
  if (!claims || !claims.sub) return null;
  return {
    id: claims.sub,
    email: claims.email ?? null,
    user_metadata: claims.user_metadata ?? {},
  };
});

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireOD() {
  const user = await getUser();
  if (!user) redirect("/login");
  // Query ini di-cache per request — terbagi dengan sidebar & page (dulu
  // tiap OD page melakukan query profil terpisah untuk guard ini).
  const profile = await getProfileForUser(user.id);
  if (profile?.role !== "od") redirect("/");
  return user;
}

export async function requireUserClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = (data && "claims" in data ? data.claims : data) ?? null;
  if (!claims?.sub) redirect("/login");
  return {
    supabase,
    user: {
      id: claims.sub,
      email: claims.email ?? null,
      user_metadata: claims.user_metadata ?? {},
    },
  };
}
