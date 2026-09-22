import OdSidebar from "@/components/od-sidebar";
import PageTransition from "@/components/page-transition";
import SalarySettingForm from "@/components/salary-setting-form";
import { requireOD } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSidebarUser } from "@/lib/user";

export default async function OdSettingsPage() {
  const [, user, setting] = await Promise.all([
    requireOD(),
    getSidebarUser(),
    prisma.appSetting.findUnique({ where: { id: 1 } }),
  ]);
  const salaryPerDay = setting?.salaryPerDay ?? 100000;

  return (
    <div className="flex min-h-screen bg-[#eff6ff] dark:bg-[#262f49]">
      <OdSidebar />

      <main className="min-w-0 flex-1 px-6 py-6 pt-20 sm:px-8 lg:pt-6">
        <PageTransition>
        <h1 className="text-2xl font-bold text-[#1f2937] dark:text-white sm:text-3xl">
          Settings
        </h1>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {/* Profile Card */}
          <div className="rounded-lg border border-[#e5e7eb] bg-white p-5 dark:border-white/10 dark:bg-black">
            <div className="flex items-center gap-4">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Foto profil"
                  className="size-16 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="grid size-16 shrink-0 place-items-center rounded-full bg-[#deedf8] text-2xl font-bold text-[#1e3a8a] dark:bg-white/10 dark:text-[#4258ff]">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold text-[#1f2937] dark:text-white">
                  {user.name}
                </h2>
                <p className="text-sm text-[#6b7280] dark:text-white/75">
                  {user.email}
                </p>
                <p className="mt-1 text-xs font-medium text-[#0a2b6e] dark:text-[#4258ff]">
                  Officer Development (OD)
                </p>
              </div>
            </div>
          </div>

          {/* Gaji Anak Magang */}
          <div className="rounded-lg border border-[#e5e7eb] bg-white p-5 dark:border-white/10 dark:bg-black">
            <h2 className="text-sm font-semibold text-[#1f2937] dark:text-white">
              Gaji Anak Magang
            </h2>
            <p className="mt-1 text-xs text-[#6b7280] dark:text-white/75">
              Nominal uang saku per hari, dipakai saat menandai "sudah dibayar" di Rekap Aktivitas.
            </p>
            <SalarySettingForm initialValue={salaryPerDay} />
          </div>

          {/* Theme Settings */}
          <div className="rounded-lg border border-[#e5e7eb] bg-white p-5 dark:border-white/10 dark:bg-black">
            <h2 className="text-sm font-semibold text-[#1f2937] dark:text-white">
              Tampilan
            </h2>
            <p className="mt-1 text-xs text-[#6b7280] dark:text-white/75">
              Sesuaikan tampilan aplikasi
            </p>
            <div className="mt-4 flex items-center justify-between rounded-lg bg-[#f3f4f6] px-4 py-3 dark:bg-white/10">
              <span className="text-sm text-[#1f2937] dark:text-white">Dark Mode</span>
              <div className="size-10 cursor-pointer rounded-full bg-[#8b5cf6]" />
            </div>
          </div>

          {/* Notification Settings */}
          <div className="rounded-lg border border-[#e5e7eb] bg-white p-5 dark:border-white/10 dark:bg-black">
            <h2 className="text-sm font-semibold text-[#1f2937] dark:text-white">
              Notifikasi
            </h2>
            <p className="mt-1 text-xs text-[#6b7280] dark:text-white/75">
              Atur preferensi notifikasi
            </p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#1f2937] dark:text-white">Notifikasi Email</span>
                <div className="size-10 cursor-pointer rounded-full bg-[#8b5cf6]" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#1f2937] dark:text-white">Notifikasi Push</span>
                <div className="size-10 cursor-pointer rounded-full bg-[#e5e7eb] dark:bg-white/20" />
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="rounded-lg border border-[#e5e7eb] bg-white p-5 dark:border-white/10 dark:bg-black">
            <h2 className="text-sm font-semibold text-[#1f2937] dark:text-white">
              Keamanan
            </h2>
            <p className="mt-1 text-xs text-[#6b7280] dark:text-white/75">
              Kelola keamanan akun
            </p>
            <div className="mt-4 space-y-2">
              <button className="w-full rounded-lg border border-[#e5e7eb] px-4 py-2.5 text-left text-sm text-[#1f2937] transition-colors hover:bg-[#f3f4f6] dark:border-white/10 dark:text-white dark:hover:bg-white/10">
                Ubah Password
              </button>
              <button className="w-full rounded-lg border border-[#e5e7eb] px-4 py-2.5 text-left text-sm text-[#1f2937] transition-colors hover:bg-[#f3f4f6] dark:border-white/10 dark:text-white dark:hover:bg-white/10">
                Two-Factor Authentication
              </button>
            </div>
          </div>
        </div>
        </PageTransition>
      </main>
    </div>
  );
}
