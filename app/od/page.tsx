import OdSidebar from "@/components/od-sidebar";
import OdCharts from "@/components/od-charts";
import PageTransition from "@/components/page-transition";
import { requireOD } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSidebarUser } from "@/lib/user";
import { isDki } from "@/lib/domisili";

const PENDING_STATUSES = ["submitted", "pembimbing_approved", "kadep_approved"];

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function StatCard({ label, value, subtext }: { label: string; value: string; subtext?: string }) {
  return (
    <div className="rounded-[10px] border border-[#d9d9d9] bg-white p-5 dark:border-white/10 dark:bg-black">
      <p className="text-xs font-semibold leading-snug text-[#727272] dark:text-white/70">{label}</p>
      <p className="mt-2 text-2xl font-extrabold leading-tight text-[#333333] dark:text-white">
        {value}
      </p>
      {subtext && (
        <p className="mt-1 text-xs text-[#727272] dark:text-white/60">{subtext}</p>
      )}
    </div>
  );
}

export default async function OdHomePage() {
  const [
    ,
    ,
    totalSubmissions,
    pendingCount,
    domisiliGroups,
    universityGroups,
    paidSubmissions,
  ] = await Promise.all([
    requireOD(),
    getSidebarUser(),
    prisma.logbookSubmission.count(),
    prisma.logbookSubmission.count({ where: { status: { in: PENDING_STATUSES } } }),
    prisma.profile.groupBy({
      by: ["domisili"],
      where: { role: "mahasiswa" },
      _count: { _all: true },
    }),
    prisma.profile.groupBy({
      by: ["university"],
      where: { role: "mahasiswa" },
      _count: { _all: true },
    }),
    prisma.logbookSubmission.findMany({
      where: { paymentStatus: "paid" },
      select: { paidAt: true, paymentAmount: true },
      orderBy: { paidAt: "asc" },
    }),
  ]);

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

  const universityRows = universityGroups
    .filter((g) => g.university)
    .map((g) => ({ name: g.university as string, value: g._count._all }))
    .sort((a, b) => b.value - a.value);
  const universityTop = universityRows.slice(0, 5);
  const universityRest = universityRows.slice(5);
  const universityData =
    universityRest.length > 0
      ? [
          ...universityTop,
          {
            name: "Lainnya",
            value: universityRest.reduce((s, x) => s + x.value, 0),
          },
        ]
      : universityTop;

  const spendingByMonth = new Map<string, { bulan: string; tahun: number; nominal: number }>();
  for (const s of paidSubmissions) {
    if (!s.paidAt) continue;
    const tahun = s.paidAt.getFullYear();
    const bulan = MONTH_NAMES[s.paidAt.getMonth()];
    const key = `${tahun}-${s.paidAt.getMonth()}`;
    const existing = spendingByMonth.get(key);
    if (existing) existing.nominal += s.paymentAmount ?? 0;
    else spendingByMonth.set(key, { bulan, tahun, nominal: s.paymentAmount ?? 0 });
  }
  const spendingData = [...spendingByMonth.values()];

  const now = new Date();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthSpending = paidSubmissions
    .filter(
      (s) =>
        s.paidAt &&
        s.paidAt.getFullYear() === lastMonthStart.getFullYear() &&
        s.paidAt.getMonth() === lastMonthStart.getMonth()
    )
    .reduce((sum, s) => sum + (s.paymentAmount ?? 0), 0);
  const rupiah = new Intl.NumberFormat("id-ID");

  const hour = new Date().getHours();
  const greeting =
    hour < 11
      ? "Selamat pagi"
      : hour < 15
        ? "Selamat siang"
        : hour < 19
          ? "Selamat sore"
          : "Selamat malam";

  return (
    <div className="flex min-h-screen bg-[#edf7fe] dark:bg-[#262f49]">
      <OdSidebar />

      <main className="min-w-0 flex-1 px-6 py-6 pt-20 sm:px-8 lg:pt-6">
        <PageTransition>
          <div>
            <h1 className="text-2xl font-medium text-[#333333] dark:text-white sm:text-3xl">
              {greeting},
            </h1>
            <h1 className="text-2xl font-bold text-[#333333] dark:text-white sm:text-3xl">
              Team OD!
            </h1>
          </div>

          {/* Top Row - 3 Cards */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Total Anak Magang Aktif (per hari ini)"
              value={String(totalInterns)}
            />
            <StatCard
              label="Total Pengeluaran Uang Saku Bulan Lalu"
              value={`Rp ${rupiah.format(lastMonthSpending)}`}
            />
            <div className="rounded-[10px] border border-[#d9d9d9] bg-white p-5 dark:border-white/10 dark:bg-black">
              <p className="text-xs font-semibold leading-snug text-[#727272] dark:text-white/70">
                Jumlah Laporan Yang Pending Approval
              </p>
              <p className="mt-2 text-2xl font-extrabold leading-tight text-[#333333] dark:text-white">
                {pendingCount} dari {totalSubmissions} laporan
              </p>
              <p className="mt-1 text-xs text-[#727272] dark:text-white/60">
                {collectedPct}% Laporan Terkumpul
              </p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#e5e7eb] dark:bg-white/20">
                <div
                  className="h-full rounded-full bg-[#4258ff]"
                  style={{ width: `${collectedPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Middle Row - 3 Chart Cards */}
          <div className="mt-4">
            <OdCharts
              regionData={regionData}
              universityData={universityData}
              spendingData={spendingData}
            />
          </div>

          {/* Bottom Row - Log Aktivitas Card */}
          <div className="mt-4 rounded-[10px] border border-[#d9d9d9] bg-white p-5 dark:border-white/10 dark:bg-black">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="grid size-10 place-items-center rounded-lg bg-[#374adf]/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[#374adf]"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#333333] dark:text-white">
                    Log Aktivitas Anak Magang
                  </p>
                  <p className="text-xs text-[#727272] dark:text-white/60">
                    Pantau aktivitas magang melalui logbook dan update status pembayaran!
                  </p>
                </div>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#374adf]"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </div>
        </PageTransition>
      </main>
    </div>
  );
}
