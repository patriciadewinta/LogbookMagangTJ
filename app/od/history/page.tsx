import OdSidebar from "@/components/od-sidebar";
import PageTransition from "@/components/page-transition";
import HistoryContent from "@/components/history-content";
import { requireOD } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSidebarUser } from "@/lib/user";

const STATUS_LABEL: Record<string, string> = {
  submitted: "Pending",
  pembimbing_approved: "Disetujui Pembimbing",
  kadep_approved: "Disetujui Kadep",
  kadiv_approved: "Disetujui Kadiv",
  rejected: "Ditolak",
};

const dateFmt = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export default async function OdHistoryPage() {
  const [, , submissions, setting] = await Promise.all([
    requireOD(),
    getSidebarUser(),
    prisma.logbookSubmission.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        logbookFilePath: true,
        signedFilePath: true,
        status: true,
        rejectionReason: true,
        paymentStatus: true,
        paymentAmount: true,
        createdAt: true,
        hadirCount: true,
        cutiCount: true,
        pembimbingName: true,
        kadepName: true,
        kadivName: true,
      },
    }),
    prisma.appSetting.findUnique({ where: { id: 1 } }),
  ]);
  const salaryPerDay = setting?.salaryPerDay ?? 100000;

  const userIds = [...new Set(submissions.map((s) => s.userId))];
  const profiles = await prisma.profile.findMany({
    where: { id: { in: userIds } },
    select: { id: true, fullName: true },
  });
  const nameById = new Map(profiles.map((p) => [p.id, p.fullName]));

  const rows = submissions.map((s) => {
    const signedPath = s.signedFilePath ?? null;
    const nama = nameById.get(s.userId) ?? "Mahasiswa";
    const keterangan = s.status === "rejected" && s.rejectionReason ? s.rejectionReason : STATUS_LABEL[s.status] ?? s.status;
    const isPaid = !!s.paymentStatus;
    return {
      ...s,
      signedPath,
      hariMasuk: s.hadirCount ?? "—",
      hariCuti: s.cutiCount ?? "—",
      nama,
      keterangan,
      isPaid,
      nominal: s.paymentAmount ?? null,
      tanggal: dateFmt.format(new Date(s.createdAt)),
    };
  });

  return (
    <div className="flex min-h-screen bg-[#edf7fe] dark:bg-[#262f49]">
      <OdSidebar />

      <main className="min-w-0 flex-1 px-6 py-6 pt-20 sm:px-8 lg:pt-6">
        <PageTransition>
          <HistoryContent submissions={rows} salaryPerDay={salaryPerDay} />
        </PageTransition>
      </main>
    </div>
  );
}
