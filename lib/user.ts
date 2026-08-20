import { cache } from "react";
import { getUser } from "@/lib/auth";
import { getProfileForUser } from "@/lib/profile";

// Data user untuk sidebar: di-fetch di server (tanpa useEffect + round-trip
// tambahan dari client).
export const getSidebarUser = cache(async () => {
  const user = await getUser();
  if (!user) return { name: "Pengguna", email: "", avatarUrl: null };

  const profile = await getProfileForUser(user.id);

  const name =
    profile?.fullName ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Pengguna";
  const avatarUrl = profile?.avatarPath
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatarPath}`
    : null;

  return { name, email: user.email ?? "", avatarUrl };
});
