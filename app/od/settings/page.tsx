import OdSidebar from "@/components/od-sidebar";
import PageTransition from "@/components/page-transition";
import { requireOD } from "@/lib/auth";
import { getSidebarUser } from "@/lib/user";

export default async function OdSettingsPage() {
  await Promise.all([requireOD(), getSidebarUser()]);

  return (
    <div className="flex min-h-screen bg-[#edf7fe] dark:bg-[#262f49]">
      <OdSidebar />

      <main className="min-w-0 flex-1 px-4 py-7 pt-20 sm:px-8 lg:pt-7">
        <PageTransition>
        <h1 className="mt-4 text-[28px] leading-[1.15] text-black dark:text-white sm:text-[40px]">
          Settings
        </h1>
        <p className="mt-2 text-[18px] font-light leading-snug text-black dark:text-white sm:text-[20px]">
          Kelola profil dan preferensi akun OD
        </p>

        <div className="mt-8 rounded-[10px] border border-dashed border-black/20 bg-white p-6 text-center dark:border-white/20 dark:bg-black">
          <p className="text-[18px] text-black/40 dark:text-white/40">
            Halaman ini belum tersedia — design menyusul.
          </p>
        </div>
        </PageTransition>
      </main>
    </div>
  );
}
