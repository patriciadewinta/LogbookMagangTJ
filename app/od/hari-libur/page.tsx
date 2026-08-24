import OdSidebar from "@/components/od-sidebar";
import HolidayTabs from "@/components/holiday-tabs";
import PageTransition from "@/components/page-transition";
import { requireOD } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSidebarUser } from "@/lib/user";

export default async function OdHariLiburPage() {
  const [, , holidays] = await Promise.all([
    requireOD(),
    getSidebarUser(),
    prisma.holiday.findMany({
      orderBy: { date: "asc" },
      select: { date: true, name: true, type: true, isLibur: true, year: true },
    }),
  ]);

  return (
    <div className="flex min-h-screen bg-[#edf7fe] dark:bg-[#262f49]">
      <OdSidebar />

      <main className="min-w-0 flex-1 px-4 py-7 pt-20 sm:px-8 lg:pt-7">
        <PageTransition>
          <h1 className="mt-4 text-[28px] leading-[1.15] text-black dark:text-white sm:text-[40px]">
            Hari Libur
          </h1>
          <p className="mt-2 text-[18px] font-light leading-snug text-black dark:text-white sm:text-[20px]">
            Kelola hari libur non-normal (libur nasional & cuti bersama). Sabtu dan Minggu otomatis libur.
          </p>

          <HolidayTabs holidays={holidays} />
        </PageTransition>
      </main>
    </div>
  );
}
