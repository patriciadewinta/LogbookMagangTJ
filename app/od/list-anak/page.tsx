import OdSidebar from "@/components/od-sidebar";
import OdInternTable from "@/components/od-intern-table";
import PageTransition from "@/components/page-transition";
import { requireOD } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSidebarUser } from "@/lib/user";

export default async function OdListAnakPage() {
  const [, , interns] = await Promise.all([
    requireOD(),
    getSidebarUser(),
    prisma.profile.findMany({
      where: { role: "mahasiswa" },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        university: true,
        domisili: true,
        posisi: true,
        startDate: true,
        endDate: true,
      },
    }),
  ]);

  return (
    <div className="flex min-h-screen bg-[#edf7fe] dark:bg-[#262f49]">
      <OdSidebar />

      <main className="min-w-0 flex-1 px-4 py-7 pt-20 sm:px-8 lg:pt-7">
        <PageTransition>
        <h1 className="mt-4 text-[28px] leading-[1.15] text-black dark:text-white sm:text-[40px]">
          List Anak Magang
        </h1>
        <p className="mt-2 text-[18px] font-light leading-snug text-black dark:text-white sm:text-[20px]">
          Daftar anak magang, posisi, dan periode magangnya
        </p>

        <OdInternTable interns={interns} />
        </PageTransition>
      </main>
    </div>
  );
}
