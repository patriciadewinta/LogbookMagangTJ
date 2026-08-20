import OdSidebar from "@/components/od-sidebar";
import OdCharts from "@/components/od-charts";
import PageTransition from "@/components/page-transition";
import { requireOD } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSidebarUser } from "@/lib/user";
import { isDki } from "@/lib/domisili";

const STATUS_LABEL: Record<string, string> = {
  submitted: "Pending",
  pembimbing_approved: "Disetujui Pembimbing",
  kadep_approved: "Disetujui Kadep",
  kadiv_approved: "Disetujui Kadiv",
  rejected: "Ditolak",
};

const PENDING_STATUSES = ["submitted", "pembimbing_approved", "kadep_approved"];

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-[#d9d9d9] bg-white p-4 dark:border-white/10 dark:bg-black sm:p-5">
      <p className="text-[14px] font-semibold leading-snug text-black dark:text-white">{label}</p>
      <p className="mt-2 text-[26px] font-extrabold leading-tight text-black dark:text-white">
        {value}
      </p>
    </div>
  );
}

export default async function OdHomePage() {
  // Guard, sidebar, dan semua query page jalan paralel. requireOD di dalam
  // Promise.all tetap melempar redirect bila tidak lolos guard.
  const [, , totalSubmissions, pendingCount, recent, domisiliGroups] = await Promise.all([
    requireOD(),
    getSidebarUser(),
    prisma.logbookSubmission.count(),
    prisma.logbookSubmission.count({ where: { status: { in: PENDING_STATUSES } } }),
    prisma.logbookSubmission.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, userId: true, status: true, createdAt: true },
    }),
    // groupBy: total & sebaran domisili dalam satu query (dulu 2 query +
    // transfer semua baris profil).
    prisma.profile.groupBy({
      by: ["domisili"],
      where: { role: "mahasiswa" },
      _count: { _all: true },
    }),
  ]);

  const userIds = [...new Set(recent.map((r) => r.userId))];
  const profiles = await prisma.profile.findMany({
    where: { id: { in: userIds } },
    select: { id: true, fullName: true },
  });
  const nameById = new Map(profiles.map((p) => [p.id, p.fullName]));

  let totalInterns = 0;
  let dki = 0;
  let nonDki = 0;
  for (const g of domisiliGroups) {
    const n = g._count._all;
    totalInterns += n;
    if (isDki(g.domisili)) dki += n;
    else nonDki += n;
  }

  const collectedPct = totalInterns
    ? Math.min(100, Math.round((totalSubmissions / totalInterns) * 100))
    : 0;
  const regionData = [
    { name: "DKI Jakarta", value: dki },
    { name: "Non DKI Jakarta", value: nonDki },
  ];

  const hour = new Date().getHours();
  const greeting =
    hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 19 ? "Selamat sore" : "Selamat malam";

  return (
    <div className="flex min-h-screen bg-[#edf7fe] dark:bg-[#262f49]">
      <OdSidebar />

      <main className="min-w-0 flex-1 px-4 py-7 pt-20 sm:px-8 lg:pt-7">
        <PageTransition>
        <h1 className="mt-4 text-[26px] leading-[1.2] text-black dark:text-white sm:text-[40px] sm:leading-[1.15]">
          {greeting},
          <br />
          <em className="font-bold italic">Transjakarta Team OD!</em>
        </h1>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <StatCard
            label="Total Anak Magang Aktif (per hari ini)"
            value={String(totalInterns)}
          />
          <StatCard label="Total Pengeluaran Uang Saku Bulan Lalu" value="Rp 54.000.000,00" />
          <StatCard
            label="Jumlah Laporan Yang Pending Approval"
            value={`${pendingCount} dari ${totalSubmissions} laporan`}
          />
        </div>

        <div className="mt-6 rounded-[10px] border border-[#d9d9d9] bg-white p-4 dark:border-white/10 dark:bg-black sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-semibold text-black dark:text-white">Laporan Terkumpul</p>
            <p className="text-[14px] font-bold text-black dark:text-white">{collectedPct}%</p>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#e0e0e0] dark:bg-white/20">
            <div
              className="h-full rounded-full bg-[#00D4D8]"
              style={{ width: `${collectedPct}%` }}
            />
          </div>
        </div>

        <div className="mt-6">
          <OdCharts regionData={regionData} />
        </div>

        <div className="mt-6 rounded-[10px] border border-[#d9d9d9] bg-white p-4 dark:border-white/10 dark:bg-black sm:p-5">
          <p className="text-[18px] font-semibold text-black dark:text-white">
            Log Aktivitas Anak Magang
          </p>
          <p className="mt-0.5 text-[14px] text-black/40 dark:text-white/40">
            Pantau aktivitas magang melalui logbook dan update status pembayaran!
          </p>

          <div className="mt-4 flex flex-col gap-3">
            {recent.length > 0 ? (
              recent.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center gap-3 rounded-[10px] border border-[#e8e8e8] px-4 py-3 dark:border-white/10"
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#deedf8] text-[14px] font-bold text-[#001192] dark:bg-white/10 dark:text-[#4258ff]">
                    {(nameById.get(r.userId) ?? "M").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-black dark:text-white">
                      {nameById.get(r.userId) ?? "Mahasiswa"}
                    </p>
                    <p className="truncate text-[13px] text-black/40 dark:text-white/40">
                      {dateFmt.format(new Date(r.createdAt))}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-[10px] bg-[#deedf8] px-3 py-1 text-[13px] font-semibold text-[#001192] dark:bg-white/10 dark:text-[#4258ff]">
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="rounded-[10px] border border-dashed border-black/20 px-4 py-6 text-center text-[15px] text-black/40 dark:border-white/20 dark:text-white/40">
                Belum ada laporan dari anak magang.
              </p>
            )}
          </div>
        </div>
        </PageTransition>
      </main>
    </div>
  );
}
