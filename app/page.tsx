import { ViewTransition } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import Calendar from "@/components/calendar";
import PageTransition from "@/components/page-transition";
import Sidebar from "@/components/sidebar";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSidebarUser } from "@/lib/user";
import { getWorkdayCount } from "@/lib/holidays";
import { timer } from "@/lib/timing";

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

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const cardCls =
  "relative overflow-hidden rounded-[20px] border border-[#E8EEF7] bg-white shadow-[0_8px_30px_rgba(17,24,39,0.05)] dark:border-white/10 dark:bg-black";

type StepTone = "ok" | "wait" | "idle" | "bad";

function CardBadge({
  tone,
  icon,
  children,
}: {
  tone: "blue" | "green";
  icon?: ReactNode;
  children: ReactNode;
}) {
  const cls =
    tone === "green"
      ? "border-transparent bg-green-500 text-white dark:border-transparent dark:bg-green-500 dark:text-white"
      : "border-transparent bg-[#2357FF] text-white shadow-[0_4px_12px_rgba(35,87,255,0.30)] dark:border-transparent dark:bg-[#4258ff] dark:text-white dark:shadow-none";
  return (
    <span
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold leading-none ${cls}`}
    >
      {icon}
      {children}
    </span>
  );
}

// Dekorasi background: blob organik + wave pojok kanan atas & bawah, bubble
// 20/40/80px tersebar. Kelihatan tapi lembut (Apple/Linear vibe). Dark: off.
function BgDecor() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Blob organik + garis wave pojok kanan atas. Dark: warna lebih
          terang (#8FA6FF) biar dekorasi tetap keliatan di bg gelap. */}
      <div className="absolute -right-28 -top-24 size-[440px] rounded-[46%_54%_52%_48%/48%_44%_56%_52%] bg-[#D6E4F7]/60 dark:bg-[#4258ff]/30" />
      <svg
        className="absolute -right-10 -top-16 stroke-[#2357FF] dark:stroke-[#8FA6FF]"
        width="560"
        height="360"
        viewBox="0 0 560 360"
        fill="none"
      >
        <path
          d="M560 70C396 94 316 182 288 326"
          strokeOpacity="0.14"
          strokeWidth="1.5"
        />
        <path
          d="M560 124c-134 20-206 98-232 210"
          strokeOpacity="0.09"
          strokeWidth="1.5"
        />
      </svg>
      {/* Wave + bubble pojok kanan bawah */}
      <svg
        className="absolute -bottom-6 right-0 stroke-[#2357FF] dark:stroke-[#8FA6FF]"
        width="480"
        height="200"
        viewBox="0 0 480 200"
        fill="none"
      >
        <path
          d="M0 156c100-48 200 36 300-10s132-24 180-4"
          strokeOpacity="0.16"
          strokeWidth="1.5"
        />
        <path
          d="M52 200c92-36 170 22 272-16"
          strokeOpacity="0.09"
          strokeWidth="1.5"
        />
        <circle
          cx="400"
          cy="56"
          r="40"
          className="fill-[#D6E4F7] dark:fill-[#8FA6FF]"
          fillOpacity="0.7"
        />
        <circle
          cx="322"
          cy="126"
          r="18"
          className="fill-[#2357FF] dark:fill-[#8FA6FF]"
          fillOpacity="0.09"
        />
      </svg>
      {/* Bubble & titik tersebar */}
      <div className="absolute right-[32%] top-[7%] size-20 rounded-full bg-[#D6E4F7]/70 dark:bg-[#8FA6FF]/30" />
      <div className="absolute right-[9%] top-[45%] size-10 rounded-full bg-[#D6E4F7] dark:bg-[#8FA6FF]/40" />
      <div className="absolute bottom-[5%] right-[38%] size-5 rounded-full bg-[#2357FF]/10 dark:bg-[#8FA6FF]/25" />
      <div className="absolute left-[36%] top-[5%] size-2.5 rounded-full bg-[#2357FF]/10 dark:bg-[#8FA6FF]/25" />
      <div className="absolute bottom-[28%] left-[28%] size-2 rounded-full bg-[#2357FF]/[0.08] dark:bg-[#8FA6FF]/20" />
    </div>
  );
}

// Lembah berisi (filled hills) di dasar kartu. Tiga varian biar tiap kartu
// beda bentuk; semua path mulai & berakhir di garis bawah (y=90) supaya
// ujungnya menyatu mulus ke dasar kartu, nggak kepotong tegak.
function HillWave({ variant }: { variant: "right" | "wide" | "left" }) {
  if (variant === "wide") {
    return (
      <svg
        aria-hidden
        viewBox="0 0 400 70"
        preserveAspectRatio="none"
        fill="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[70px] w-full"
      >
        <path
          d="M0 70 C 50 40, 90 58, 140 48 C 190 38, 220 60, 270 52 C 320 44, 360 58, 400 70 Z"
          className="fill-[#D6E4F7]/70 dark:fill-[#8FA6FF]/10"
        />
      </svg>
    );
  }
  if (variant === "left") {
    return (
      <svg
        aria-hidden
        viewBox="0 0 200 90"
        preserveAspectRatio="none"
        fill="none"
        className="pointer-events-none absolute bottom-0 left-0 h-[90px] w-1/2"
      >
        <path
          d="M200 90 C 170 90, 158 34, 118 38 C 82 42, 68 76, 38 78 C 20 79, 9 85, 0 90 Z"
          className="fill-[#2357FF]/[0.08] dark:fill-[#8FA6FF]/10"
        />
        <path
          d="M200 90 C 176 90, 168 52, 132 56 C 100 60, 88 84, 55 85 C 30 86, 14 88, 0 90 Z"
          className="fill-[#D6E4F7]/70 dark:fill-[#8FA6FF]/10"
        />
      </svg>
    );
  }
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 90"
      preserveAspectRatio="none"
      fill="none"
      className="pointer-events-none absolute bottom-0 right-0 h-[90px] w-1/2"
    >
      <path
        d="M0 90 C 30 90, 42 36, 82 40 C 118 44, 132 76, 165 78 C 182 79, 192 85, 200 90 Z"
        className="fill-[#D6E4F7]/70 dark:fill-[#8FA6FF]/10"
      />
      <path
        d="M0 90 C 24 90, 32 54, 68 58 C 100 62, 112 84, 145 85 C 170 86, 186 88, 200 90 Z"
        className="fill-[#2357FF]/[0.08] dark:fill-[#8FA6FF]/10"
      />
    </svg>
  );
}

function ProgressCard({
  title,
  value,
  percent,
  hint,
  badge,
  decor,
  hill = "wide",
  done = false,
}: {
  title: string;
  value: string;
  percent: number;
  hint: string;
  badge: ReactNode;
  decor?: ReactNode;
  hill?: "right" | "wide" | "left";
  done?: boolean;
}) {
  return (
    <div className={`${cardCls} p-5 sm:p-6`}>
      {decor}
      <HillWave variant={hill} />
      <div className="relative flex items-center gap-3">
        <p className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[#111827] dark:text-white">
          {title}
        </p>
        {badge}
      </div>
      <p className="relative mt-4 text-[24px] font-extrabold leading-tight text-[#111827] dark:text-white">
        {value}
      </p>
      <p className="relative mt-3 text-[14px] text-[#6B7280] dark:text-white/75">
        {percent}% {hint}
      </p>
      <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E8EEF7] dark:bg-white/20">
        <div
          className={`h-full rounded-full ${done ? "bg-green-500" : "bg-[#2357FF]"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function Stepper({
  doneCount,
  currentIndex,
  statuses,
}: {
  doneCount: number;
  currentIndex: number;
  statuses: { text: string; tone: StepTone }[];
}) {
  const toneCls: Record<StepTone, string> = {
    ok: "text-[#2357FF] dark:text-[#8FA6FF]",
    wait: "text-[#2357FF] dark:text-[#8FA6FF]",
    idle: "text-[#9CA3AF] dark:text-white/65",
    bad: "text-red-500 dark:text-red-400",
  };
  return (
    <div className={`${cardCls} mt-5 px-4 py-4 sm:px-6 sm:py-5`}>
      <div className="flex items-center gap-1.5">
        <p className="text-[14px] font-semibold text-[#111827] dark:text-white">
          Progress Pengumpulan Logbook
        </p>
        <span
          title="Logbook disetujui berjenjang: pembimbing → kadep/kadiv, lalu diteruskan ke OD."
          className="cursor-help text-[#9CA3AF] dark:text-white/65"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5" strokeLinecap="round" />
            <path d="M12 8h.01" strokeLinecap="round" />
          </svg>
        </span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <div className="flex min-w-[560px] items-start justify-between px-2 sm:px-6">
          {STEP_LABELS.map((label, i) => {
            const done = i < doneCount;
            const current = i === currentIndex;
            const st = statuses[i] ?? { text: "Belum dimulai", tone: "idle" as StepTone };
            return (
              <div key={i} className="contents">
                {i > 0 && (
                  <div
                    className={`h-px flex-1 translate-y-[18px] ${
                      i < doneCount ? "bg-[#2357FF] dark:bg-[#4258ff]" : "bg-[#E8EEF7] dark:bg-white/20"
                    }`}
                  />
                )}
                <div className="flex w-[120px] shrink-0 flex-col items-center gap-1.5">
                  <div
                    className={`grid size-9 place-items-center rounded-full text-[14px] font-semibold ${
                      done
                        ? "bg-[#2357FF] text-white dark:bg-[#4258ff]"
                        : current
                          ? "border-2 border-[#2357FF] bg-white text-[#2357FF] dark:border-[#4258ff] dark:bg-black dark:text-[#8FA6FF]"
                          : "border-2 border-[#E8EEF7] bg-white text-[#9CA3AF] dark:border-white/20 dark:bg-black dark:text-white/65"
                    }`}
                  >
                    {done ? (
                      <img src="/assets/step-check.svg" alt="" className="size-6" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <p
                    className={`text-center text-[11px] font-medium leading-[16px] ${
                      done || current
                        ? "text-[#111827] dark:text-white"
                        : "text-[#6B7280] dark:text-white/70"
                    }`}
                  >
                    {label[0]}
                    <br />
                    {label[1]}
                  </p>
                  <p className={`text-center text-[11px] leading-[14px] ${toneCls[st.tone]}`}>
                    {st.text}
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
  // SEMENTARA: pisahkan waktu auth, query, dan hitung hari kerja.
  const tm = timer("home");

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;

  // requireUser() dulu di-await sendirian di atas Promise.all, jadi keempat
  // query baru mulai SETELAH verifikasi JWT kelar — satu lapis waterfall
  // sia-sia. Sekarang dikelompokkan: yang butuh user.id menunggu di dalam
  // closure (paralel satu sama lain), yang tidak butuh jalan sejak detik
  // pertama.
  const [{ user, profile, latest, monthSubmission }, , workdays] = await Promise.all([
    requireUser().then(async (user) => {
      tm.mark("auth"); // verifikasi JWT selesai
      const [profile, latest, monthSubmission] = await Promise.all([
        prisma.profile.findUnique({
          where: { id: user.id },
          select: { fullName: true, startDate: true, endDate: true, role: true },
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
      ]);
      tm.mark("queries");
      return { user, profile, latest, monthSubmission };
    }),
    // Data sidebar — cache() membagikan hasilnya ke <Sidebar /> saat render.
    getSidebarUser(),
    // getWorkdayCount bisa fetch kalender libur ke Google kalau cache-nya
    // hangus — ini kandidat penyebab lambat, jadi diukur terpisah.
    getWorkdayCount(curYear, curMonth).then((w) => {
      tm.mark("workdays");
      return w;
    }),
  ]);
  tm.done();

  // Petugas OD punya beranda sendiri. Dulu proxy yang mengarahkan ke sini
  // (dengan query profil terpisah di setiap request); sekarang profilnya toh
  // sudah ter-fetch di atas, jadi redirect-nya gratis.
  if (profile?.role === "od") redirect("/od");

  let fullName = (user.user_metadata?.full_name as string) ?? user.email?.split("@")[0] ?? "Kamu";

  if (profile?.fullName) fullName = profile.fullName;
  const hadir = monthSubmission?.hadirCount ?? null;
  const attendanceValue = hadir === null ? "—" : `${hadir} dari ${workdays} hari`;
  const attendancePercent =
    hadir === null || workdays === 0 ? 0 : Math.round((hadir / workdays) * 100);

  // Progress magang dari rentang tanggal yang diisi HR.
  let progressValue = "—";
  let progressPercent = 0;
  let internBadge: { phase: string; months: string } | null = null;
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
        // Persen pakai hitungan hari inklusif (kayak MagangHub): 100% tepat di
        // hari terakhir, mentok 100% setelahnya.
        const totalDays = Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
        const elapsedDays = Math.floor((now.getTime() - s.getTime()) / 86400000) + 1;
        const clamped = Math.max(0, Math.min(totalDays, elapsedDays));
        progressPercent = Math.round((clamped / totalDays) * 100);
        const phase =
          now.getTime() > e.getTime()
            ? "Magang selesai"
            : n >= totalMonths
              ? "Magang hampir selesai"
              : "Magang berlangsung";
        internBadge = { phase, months: `Bulan ke-${n} dari ${totalMonths}` };
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

  const idleStep = { text: "Belum dimulai", tone: "idle" as StepTone };
  let statuses: { text: string; tone: StepTone }[];
  if (!latest) {
    statuses = [idleStep, idleStep, idleStep, idleStep];
  } else if (latest.status === "rejected") {
    statuses = [{ text: "Ditolak", tone: "bad" }, idleStep, idleStep, idleStep];
  } else {
    statuses = STEP_LABELS.map((_, i) => {
      if (i < step.done) return { text: "Selesai", tone: "ok" as StepTone };
      if (i === step.current) {
        return i === 3
          ? { text: "Sedang dikirim", tone: "wait" as StepTone }
          : { text: "Menunggu persetujuan", tone: "wait" as StepTone };
      }
      return idleStep;
    });
  }

  const hour = now.getHours();
  const greeting =
    hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 19 ? "Selamat sore" : "Selamat malam";

  return (
    <div className="relative flex min-h-screen bg-[#F4F9FF] dark:bg-[#262f49]">
      <Sidebar />
      <BgDecor />

      <main className="relative min-w-0 flex-1 px-4 py-7 pt-20 sm:px-8 lg:pt-7">
        <PageTransition>
        <div className="mt-4 flex flex-col items-stretch gap-6 lg:flex-row lg:gap-8">
          <div className="flex flex-1 flex-col justify-between">
            <div>
              <h1 className="text-[26px] leading-[1.2] text-[#111827] dark:text-white sm:text-[40px] sm:leading-[1.15]">
                {greeting},
                <br />
                <span className="font-bold">{fullName}!</span>
              </h1>
              {internBadge && (
                <div className="mt-3 inline-flex h-8 items-center gap-2 self-start rounded-full border border-[#E8EEF7] bg-white px-3.5 shadow-[0_2px_10px_rgba(17,24,39,0.05)] dark:border-[#4258ff]/40 dark:bg-[#4258ff]/15 dark:shadow-none">
                  <span className="size-2 shrink-0 rounded-full bg-[#2357FF] dark:bg-[#8FA6FF]" />
                  <span className="text-[13px] font-medium text-[#111827] dark:text-white">
                    {internBadge.phase}
                  </span>
                  <span aria-hidden className="h-3.5 w-px shrink-0 bg-[#E8EEF7] dark:bg-white/20" />
                  <span className="text-[13px] font-semibold text-[#2357FF] dark:text-[#8FA6FF]">
                    {internBadge.months}
                  </span>
                </div>
              )}
            </div>
            <ViewTransition
              name="main-card"
              default="block"
            >
            <Link
              href="/input-logbook"
              transitionTypes={["nav-forward"]}
              className="relative mt-6 flex items-center gap-4 overflow-hidden rounded-[20px] border border-[#E8EEF7] bg-white p-4 shadow-[0_8px_30px_rgba(17,24,39,0.05)] transition-shadow hover:shadow-[0_12px_40px_rgba(17,24,39,0.10)] sm:gap-5 sm:p-5 dark:border-white/10 dark:bg-black lg:mt-0"
            >
              <HillWave variant="right" />
              <div className="relative grid size-11 shrink-0 place-items-center rounded-[10px] bg-[#EAF1FF] sm:size-12">
                <img src="/assets/pdf-icon.png" alt="" className="size-9 object-contain sm:size-10" />
              </div>
              <div className="relative min-w-0">
                <p className="text-[17px] font-semibold leading-snug text-[#111827] dark:text-white sm:text-[20px]">
                  Submit laporan magang
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[#6B7280] dark:text-white/70 sm:text-[14px]">
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
              <span className="relative ml-auto flex shrink-0 items-center gap-2 rounded-full bg-[#2357FF] px-4 py-2.5 text-[14px] font-semibold text-white shadow-[0_6px_16px_rgba(35,87,255,0.35)] sm:px-5 sm:text-[15px] dark:bg-[#4258ff] dark:shadow-none">
                <span className="hidden sm:inline">Kirim laporan</span>
                <svg
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
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
            badge={
              <CardBadge
                tone="blue"
                icon={
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="5" width="18" height="16" rx="3" />
                    <path d="M8 3v4M16 3v4M3 10h18" strokeLinecap="round" />
                  </svg>
                }
              >
                {MONTHS_SHORT[curMonth - 1]} {curYear}
              </CardBadge>
            }
          />
          <ProgressCard
            title="Progress Magang"
            value={progressValue}
            percent={progressPercent}
            hint="Progress"
            hill="left"
            done={progressPercent >= 100}
            badge={
              progressValue === "—" ? null : (
                <CardBadge
                  tone={progressPercent >= 100 ? "green" : "blue"}
                  icon={
                    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M8.5 12.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  }
                >
                  {progressPercent >= 100 ? "Selesai" : "Berlangsung"}
                </CardBadge>
              )
            }
          />
        </div>

        <Stepper doneCount={step.done} currentIndex={step.current} statuses={statuses} />
        </PageTransition>
      </main>
    </div>
  );
}
