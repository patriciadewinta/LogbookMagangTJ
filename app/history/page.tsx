import Sidebar from "@/components/sidebar";
import PageTransition from "@/components/page-transition";
import HistoryTabs from "@/components/history-tabs";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSidebarUser } from "@/lib/user";

export default async function HistoryPage() {
  // Guard dulu (butuh user.id untuk query), lalu sidebar + data page paralel.
  const user = await requireUser();
  const [, submissions] = await Promise.all([
    getSidebarUser(),
    prisma.logbookSubmission.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        logbookFilePath: true,
        signedFilePath: true,
        status: true,
        rejectionReason: true,
        createdAt: true,
        paymentStatus: true,
        paymentAmount: true,
        paidAt: true,
        periodYear: true,
        periodMonth: true,
        hadirCount: true,
        cutiCount: true,
      },
    }),
  ]);

  return (
    <div className="flex min-h-screen bg-[#edf7fe] dark:bg-[#262f49]">
      <Sidebar />

      <main className="min-w-0 flex-1 px-4 py-7 pt-20 sm:px-8 lg:pt-7">
        <PageTransition>
        <h1 className="mt-4 text-[28px] leading-[1.15] text-black dark:text-white sm:text-[40px]">
          History Logbook
        </h1>
        <p className="mt-2 text-[18px] font-light leading-snug text-black dark:text-white sm:text-[20px]">
          Riwayat laporan magang yang sudah kamu submit
        </p>

        <HistoryTabs submissions={submissions} />
        </PageTransition>
      </main>
    </div>
  );
}
