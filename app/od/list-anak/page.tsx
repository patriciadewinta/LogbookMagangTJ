import OdSidebar from "@/components/od-sidebar";
import ListAnakContent from "@/components/list-anak-content";
import PageTransition from "@/components/page-transition";
import { requireOD } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSidebarUser } from "@/lib/user";

export default async function OdListAnakPage() {
  const [, user, interns] = await Promise.all([
    requireOD(),
    getSidebarUser(),
    prisma.profile.findMany({
      where: { role: "mahasiswa" },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        university: true,
        domisili: true,
        posisi: true,
        startDate: true,
        endDate: true,
        phone: true,
      },
    }),
  ]);

  return (
    <div className="flex min-h-screen bg-[#edf7fe] dark:bg-[#262f49]">
      <OdSidebar />

      <main className="min-w-0 flex-1 px-6 py-6 pt-20 sm:px-8 lg:pt-6">
        <PageTransition>
          <ListAnakContent initialInterns={interns} />
        </PageTransition>
      </main>
    </div>
  );
}
