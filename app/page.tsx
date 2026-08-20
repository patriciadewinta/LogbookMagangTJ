import { ViewTransition } from "react";
import Link from "next/link";
import Calendar from "@/components/calendar";
import PageTransition from "@/components/page-transition";
import Sidebar from "@/components/sidebar";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSidebarUser } from "@/lib/user";
import { getWorkdayCount } from "@/lib/holidays";

// Tanggal laporan = hari weekdays terakhir pada bulan periode (bulan
// berakhir Sabtu/Minggu → mundur ke Jumat). Mis. Agustus 2026 → tgl 31 (Senin).
function lastWeekdayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 0);
  if (d.getDay() === 0) d.setDate(d.getDate() - 2);
  else if (d.getDay() === 6) d.setDate(d.getDate() - 1);
  return d;
}

const STEP_LABELS = [
  ["Submit", "Laporan"],
  ["Persetujuan", "Pembimbing"],
  ["Persetujuan", "Kadep/Kadiv"],
  ["Terkirim", "ke OD"],
];

const STATUS_LABEL: Record<string, string> = {
  submitted: "Pending",
  pembimbing_approved: "Disetujui Pembimbing",
  kadep_approved: "Disetujui Kadep",
  kadiv_approved: "Disetujui Kadiv",
  rejected: "Ditolak",
};

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function ProgressCard({
  title,
  value,
  percent,
  hint,
}: {
  title: string;
  value: string;
  percent: number;
  hint: string;
}) {
  return (
    <div className="rounded-[10px] border border-[#d9d9d9] bg-white p-4 dark:border-white/10 dark:bg-black sm:p-5">
      <p className="text-[14px] font-semibold text-black dark:text-white">{title}</p>
      <p className="mt-1 text-[24px] font-extrabold leading-tight text-black dark:text-white">
        {value}
      </p>
      <p className="mt-3 text-[14px] text-black dark:text-white">{percent}% {hint}</p>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#e0e0e0] dark:bg-white/20">
        <div
          className="h-full rounded-full bg-[#0043ce]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function Stepper({
  doneCount,
  currentIndex,
}: {
  doneCount: number;
  currentIndex: number;
}) {
  return (
    <div className="mt-5 rounded-[10px] border border-[#d9d9d9] bg-white px-4 py-4 dark:border-white/10 dark:bg-black sm:px-6 sm:py-5">
      <p className="text-[14px] font-semibold text-black dark:text-white">
        Progres pengumpulan logbook
      </p>
      <div className="mt-5 overflow-x-auto">
      <div className="flex min-w-[440px] items-center justify-between px-4 sm:px-8">
        {STEP_LABELS.map((label, i) => {
          const done = i < doneCount;
          const current = i === currentIndex;
          const lineColor =
            i < doneCount ? "bg-[#0043ce]" : "bg-[#c6c6c6] dark:bg-white/20";
          return (
            <div key={i} className="contents">
              {i > 0 && (
                <div className={`h-px flex-1 self-start translate-y-[14px] ${lineColor}`} />
              )}
              <div className="flex w-[110px] shrink-0 flex-col items-center gap-2">
                <div
                  className={`grid size-[30px] place-items-center rounded-full text-[14px] font-semibold ${
                    done
                      ? "bg-[#0043ce]"
                      : current
                        ? "border-2 border-[#0043ce] bg-white text-black dark:bg-black dark:text-white"
                        : "border-2 border-[#c6c6c6] bg-white text-black dark:border-white/20 dark:bg-black dark:text-white"
                  }`}
                >
                  {done ? (
                    <img src="/assets/step-check.svg" alt="" className="size-[26px]" />
                  ) : (
                    i + 1
                  )}
                </div>
                <p className="text-center text-[10px] font-medium leading-[16px] tracking-[0.5px] text-[#6f6f6f] dark:text-white/60">
                  {label[0]}
                  <br />
                  {label[1]}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const user = await requireUser();

  let fullName = (user.user_metadata?.full_name as string) ?? user.email?.split("@")[0] ?? "Kamu";

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;

  // Semua query berjalan paralel (dulu beruntun 4 round-trip), termasuk
  // data sidebar — cache() membagikan hasilnya ke <Sidebar /> saat render.
  const [, profile, latest, monthSubmission, workdays] = await Promise.all([
    getSidebarUser(),
    prisma.profile.findUnique({
      where: { id: user.id },
      select: { fullName: true, startDate: true, endDate: true },
    }),
    prisma.logbookSubmission.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        createdAt: true,
        periodYear: true,
        periodMonth: true,
        hadirCount: true,
      },
    }),
    // Submission terbaru periode bulan berjalan (untuk kartu kehadiran).
    prisma.logbookSubmission.findFirst({
      where: { userId: user.id, periodYear: curYear, periodMonth: curMonth },
      orderBy: { createdAt: "desc" },
      select: { hadirCount: true },
    }),
    getWorkdayCount(curYear, curMonth),
  ]);

  if (profile?.fullName) fullName = profile.fullName;
  const hadir = monthSubmission?.hadirCount ?? null;
  const attendanceValue = hadir === null ? "—" : `${hadir} dari ${workdays} hari`;
  const attendancePercent =
    hadir === null || workdays === 0 ? 0 : Math.round((hadir / workdays) * 100);

  // Progress magang dari rentang tanggal yang diisi HR.
  let progressValue = "—";
  let progressPercent = 0;
  if (profile?.startDate && profile?.endDate) {
    const s = new Date(`${profile.startDate}T00:00:00`);
    const e = new Date(`${profile.endDate}T00:00:00`);
    if (!Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime()) && e >= s) {
      const totalMonths =
        (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
      if (totalMonths >= 1) {
        const monthNow =
          (now.getFullYear() - s.getFullYear()) * 12 + (now.getMonth() - s.getMonth()) + 1;
        const n = Math.max(1, Math.min(totalMonths, monthNow));
        progressValue = `Bulan ke-${n} dari ${totalMonths} bulan`;
        // Bulan pertama dimulai dari 0%, bukan 1 bulan penuh.
        progressPercent = Math.round(((n - 1) / totalMonths) * 100);
      }
    }
  }

  // Langkah stepper diturunkan dari status approval terakhir.
  const STEP_STATE: Record<string, { done: number; current: number }> = {
    submitted: { done: 1, current: 1 },
    pembimbing_approved: { done: 2, current: 2 },
    kadep_approved: { done: 3, current: 3 },
    kadiv_approved: { done: 4, current: -1 },
    rejected: { done: 0, current: 0 },
  };
  const step = latest
    ? (STEP_STATE[latest.status] ?? { done: 0, current: 0 })
    : { done: 0, current: 0 };

  const hour = now.getHours();
  const greeting =
    hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 19 ? "Selamat sore" : "Selamat malam";

  return (
    <div className="flex min-h-screen bg-[#edf7fe] dark:bg-[#262f49]">
      <Sidebar />

      <main className="min-w-0 flex-1 px-4 py-7 pt-20 sm:px-8 lg:pt-7">
        <PageTransition>
        <div className="mt-4 flex flex-col items-stretch gap-6 lg:flex-row lg:gap-8">
          <div className="flex flex-1 flex-col justify-between">
            <h1 className="text-[26px] leading-[1.2] text-black dark:text-white sm:text-[40px] sm:leading-[1.15]">
              {greeting},
              <br />
              <em className="font-bold italic">{fullName}!</em>
            </h1>
            <ViewTransition
              name="main-card"
              default="block"
            >
            <Link
              href="/input-logbook"
              transitionTypes={["nav-forward"]}
              className="flex items-center gap-4 rounded-[10px] border border-[#d9d9d9] bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:gap-5 sm:p-5 dark:border-white/10 dark:bg-black"
            >
              <div className="grid size-11 shrink-0 place-items-center rounded-[10px] bg-[#deedf8] sm:size-12">
                <img src="/assets/pdf-icon.png" alt="" className="size-9 object-contain sm:size-10" />
              </div>
              <div className="min-w-0">
                <p className="text-[17px] font-semibold leading-snug text-black dark:text-white sm:text-[20px]">
                  Submit laporan magang
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-black/30 dark:text-white/30 sm:text-[14px]">
                  {latest ? (
                    <>
                      <span className="flex items-center gap-1.5">
                        <span className="size-1.5 shrink-0 rounded-full bg-current" />
                        Status: {STATUS_LABEL[latest.status] ?? latest.status}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="size-1.5 shrink-0 rounded-full bg-current" />
                        Deadline: {dateFmt.format(lastWeekdayOfMonth(latest.periodYear ?? now.getFullYear(), latest.periodMonth ?? now.getMonth() + 1))}
                      </span>
                    </>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <span className="size-1.5 shrink-0 rounded-full bg-current" />
                      Belum submit laporan
                    </span>
                  )}
                </div>
              </div>
              <img
                src="/assets/forward-button.png"
                alt=""
                className="ml-auto size-10 shrink-0 object-contain sm:size-12"
              />
            </Link>
            </ViewTransition>
          </div>
          <Calendar />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ProgressCard
            title="Kehadiran di Bulan Ini"
            value={attendanceValue}
            percent={attendancePercent}
            hint="Kehadiran"
          />
          <ProgressCard
            title="Progress Magang"
            value={progressValue}
            percent={progressPercent}
            hint="Progress"
          />
        </div>

        <Stepper doneCount={step.done} currentIndex={step.current} />
        </PageTransition>
      </main>
    </div>
  );
}
