import Sidebar from "@/components/sidebar";
import PageTransition from "@/components/page-transition";
import SettingsForm from "@/components/settings-form";
import { requireUser } from "@/lib/auth";
import { getProfileForUser } from "@/lib/profile";

export default async function SettingsPage() {
  const user = await requireUser();

  // Query yang sama dipakai sidebar → total 1 query profil per request
  // (dulu 2 beruntun).
  const profile = await getProfileForUser(user.id);

  return (
    <div className="flex min-h-screen bg-[#edf7fe] dark:bg-[#262f49]">
      <Sidebar />

      <main className="min-w-0 flex-1 px-4 py-7 pt-20 sm:px-8 lg:pt-7">
        <PageTransition>
        <h1 className="mt-4 text-[28px] leading-[1.15] text-black dark:text-white sm:text-[40px]">
          Settings
        </h1>
        <p className="mt-2 text-[18px] font-light leading-snug text-black dark:text-white sm:text-[20px]">
          Kelola profil dan preferensi akun kamu
        </p>

        <SettingsForm
          initial={{
            fullName: profile?.fullName ?? "",
            email: user.email ?? "",
            university: profile?.university ?? "",
            domisili: profile?.domisili ?? "",
            posisi: profile?.posisi ?? "",
            phone: profile?.phone ?? "",
            avatarPath: profile?.avatarPath ?? null,
          }}
        />
        </PageTransition>
      </main>
    </div>
  );
}
