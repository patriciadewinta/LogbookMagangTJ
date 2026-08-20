import OdSidebar from "@/components/od-sidebar";
import PageTransition from "@/components/page-transition";
import DownloadButton from "@/components/download-button";
import DeleteSubmissionButton from "@/components/delete-submission-button";
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
  const [, , submissions] = await Promise.all([
    requireOD(),
    getSidebarUser(),
    prisma.logbookSubmission.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        logbookFilePath: true,
        signedFilePath: true,
        status: true,
        rejectionReason: true,
        paymentStatus: true,
        createdAt: true,
        hadirCount: true,
        cutiCount: true,
        pembimbingName: true,
        kadepName: true,
        kadivName: true,
      },
    }),
  ]);

  // E-sign tidak lagi digenerate saat render (dulu bikin lambat: download +
  // upload PDF per laporan tiap request). Sekarang lazy lewat downloadFile.
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
    };
  });

  return (
    <div className="flex min-h-screen bg-[#edf7fe] dark:bg-[#262f49]">
      <OdSidebar />

      <main className="min-w-0 flex-1 px-4 py-7 pt-20 sm:px-8 lg:pt-7">
        <PageTransition>
        <h1 className="mt-4 text-[28px] leading-[1.15] text-black dark:text-white sm:text-[40px]">
          Rekap Aktivitas Anak Magang
        </h1>
        <p className="mt-2 text-[18px] font-light leading-snug text-black dark:text-white sm:text-[20px]">
          Ringkasan kehadiran, keterangan, dan status pembayaran
        </p>

        <div className="mt-8 overflow-x-auto rounded-[10px] border border-[#d9d9d9] bg-white dark:border-white/10 dark:bg-black">
          {rows.length > 0 ? (
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="bg-[#374ADF]">
                  {["Nama", "Tanggal", "Total Hari Masuk", "Total Hari Cuti/Izin", "Keterangan", "Status Bayar", "Aksi"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-[14px] font-semibold text-white"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-[#f0f0f0] dark:border-white/10"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#deedf8] text-[14px] font-bold text-[#001192] dark:bg-white/10 dark:text-[#4258ff]">
                          {r.nama.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate text-[15px] font-medium text-black dark:text-white">
                          {r.nama}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[15px] text-black/70 dark:text-white/70">
                      {dateFmt.format(new Date(r.createdAt))}
                    </td>
                    <td className="px-4 py-3 text-[15px] text-black dark:text-white">{r.hariMasuk}</td>
                    <td className="px-4 py-3 text-[15px] text-black dark:text-white">{r.hariCuti}</td>
                    <td className="px-4 py-3 text-[15px] text-black/70 dark:text-white/70">{r.keterangan}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-[10px] px-3 py-1 text-[13px] font-semibold ${
                          r.isPaid
                            ? "bg-[#e3f6e8] text-[#147d2e] dark:bg-white/10 dark:text-[#5ee08a]"
                            : "bg-[#ededed] text-black/60 dark:bg-white/10 dark:text-white/60"
                        }`}
                      >
                        {r.isPaid ? "Sudah Dibayar" : "Belum Dibayar"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <DownloadButton
                          path={r.signedPath ?? r.logbookFilePath}
                          bucket="logbooks"
                          label={r.signedPath ? "E-sign" : "Logbook"}
                          submissionId={
                            r.status === "kadiv_approved" && !r.signedPath ? r.id : undefined
                          }
                        />
                        <DeleteSubmissionButton
                          submissionId={r.id}
                          submissionName={r.nama}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-6 py-10 text-center text-[16px] text-black/40 dark:text-white/40">
              Belum ada laporan dari anak magang.
            </p>
          )}
        </div>
        </PageTransition>
      </main>
    </div>
  );
}
