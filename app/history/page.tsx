import Link from "next/link";
import Sidebar from "@/components/sidebar";
import PageTransition from "@/components/page-transition";
import DownloadButton from "@/components/download-button";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSidebarUser } from "@/lib/user";

const STATUS_LABEL: Record<string, string> = {
  submitted: "Pending",
  pembimbing_approved: "Disetujui Pembimbing",
  kadep_approved: "Disetujui Kadep",
  kadiv_approved: "Disetujui Kadiv",
  rejected: "Ditolak",
};

const STATUS_STYLE: Record<string, string> = {
  submitted: "bg-[#fdf3dc] text-[#9a6b00] dark:bg-white/10 dark:text-[#ffd25e]",
  pembimbing_approved: "bg-[#deedf8] text-[#001192] dark:bg-white/10 dark:text-[#4258ff]",
  kadep_approved: "bg-[#f0e9ff] text-[#5b21b6] dark:bg-white/10 dark:text-[#c4b5fd]",
  kadiv_approved: "bg-[#e3f6e8] text-[#147d2e] dark:bg-white/10 dark:text-[#5ee08a]",
  rejected: "bg-[#fde3e3] text-[#b42318] dark:bg-white/10 dark:text-[#ff8a80]",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`shrink-0 rounded-[10px] px-4 py-1.5 text-[16px] font-semibold ${
        STATUS_STYLE[status] ?? STATUS_STYLE.rejected
      }`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const monthYearFmt = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" });

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
      },
    }),
  ]);

  return (
    <div className="flex min-h-screen bg-[#edf7fe] dark:bg-[#262f49]">
      <Sidebar />

      <main className="min-w-0 flex-1 px-4 py-7 pt-20 sm:px-8 lg:pt-7">
        <PageTransition>
        <h1 className="mt-4 text-[28px] leading-[1.15] text-black dark:text-white sm:text-[40px]">
          History Laporan
        </h1>
        <p className="mt-2 text-[18px] font-light leading-snug text-black dark:text-white sm:text-[20px]">
          Riwayat laporan magang yang sudah kamu submit
        </p>

        <div className="mt-8 flex flex-col gap-5">
          {submissions && submissions.length > 0 ? (
            submissions.map((item) => {
              const created = new Date(item.createdAt);
              const file = item.logbookFilePath.split("/").pop() ?? "";
              return (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center gap-4 rounded-[10px] border border-[#d9d9d9] bg-white p-4 sm:flex-nowrap sm:gap-5 sm:p-5 dark:border-white/10 dark:bg-black"
                >
                  <div className="grid size-12 shrink-0 place-items-center rounded-[10px] bg-[#deedf8]">
                    <img src="/assets/pdf-icon.png" alt="" className="size-10 object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[20px] font-semibold text-black dark:text-white">
                      Logbook Magang — {monthYearFmt.format(created)}
                    </p>
                    <p className="mt-0.5 truncate text-[16px] text-black/30 dark:text-white/30">
                      {file} · {dateFmt.format(created)}
                    </p>
                    {item.status === "rejected" && item.rejectionReason && (
                      <p className="mt-1 text-[14px] text-[#b42318] dark:text-[#ff8a80]">
                        Alasan: {item.rejectionReason}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={item.status} />
                  <DownloadButton
                    path={item.signedFilePath ?? item.logbookFilePath}
                    bucket="logbooks"
                    label={item.signedFilePath ? "Unduh (e-sign)" : "Unduh Logbook"}
                    own
                    submissionId={
                      item.status === "kadiv_approved" && !item.signedFilePath
                        ? item.id
                        : undefined
                    }
                  />
                </div>
              );
            })
          ) : (
            <div className="rounded-[10px] border border-[#d9d9d9] bg-white p-6 text-center dark:border-white/10 dark:bg-black">
              <p className="text-[18px] text-black/50 dark:text-white/50">
                Belum ada laporan yang disubmit.
              </p>
              <Link
                href="/input-logbook"
                className="mt-3 inline-block rounded-[10px] bg-[#001192] px-6 py-2.5 text-[16px] font-bold text-white transition-opacity hover:opacity-90 dark:bg-[#4258ff]"
              >
                Upload Logbook
              </Link>
            </div>
          )}
        </div>
        </PageTransition>
      </main>
    </div>
  );
}
