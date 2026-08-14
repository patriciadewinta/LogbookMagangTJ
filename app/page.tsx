import { ViewTransition } from "react";
import Link from "next/link";
import Calendar from "@/components/calendar";
import Sidebar from "@/components/sidebar";

const STEP_LABELS = [
  ["Submit", "Laporan"],
  ["Persetujuan", "Pembimbing"],
  ["Persetujuan", "Kadep/Kadiv"],
  ["Terkirim", "ke OD"],
];

function ProgressCard({
  title,
  value,
  percent,
}: {
  title: string;
  value: string;
  percent: number;
}) {
  return (
    <div className="rounded-[10px] border border-[#d9d9d9] bg-white p-4 dark:border-white/10 dark:bg-black sm:p-5">
      <p className="text-[14px] font-semibold text-black dark:text-white">{title}</p>
      <p className="mt-1 text-[24px] font-extrabold leading-tight text-black dark:text-white">
        {value}
      </p>
      <p className="mt-3 text-[14px] text-black dark:text-white">{percent}% Kehadiran</p>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#e0e0e0] dark:bg-white/20">
        <div
          className="h-full rounded-full bg-[#0043ce]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function Stepper() {
  return (
    <div className="mt-5 rounded-[10px] border border-[#d9d9d9] bg-white px-4 py-4 dark:border-white/10 dark:bg-black sm:px-6 sm:py-5">
      <p className="text-[14px] font-semibold text-black dark:text-white">
        Progres pengumpulan logbook
      </p>
      <div className="mt-5 overflow-x-auto">
      <div className="flex min-w-[440px] items-center justify-between px-4 sm:px-8">
        {STEP_LABELS.map((label, i) => {
          const done = i < 2;
          const current = i === 2;
          const lineColor =
            i === 0 || i === 1 ? "bg-[#0043ce]" : "bg-[#c6c6c6] dark:bg-white/20";
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

export default function HomePage() {
  return (
    <div className="flex min-h-screen bg-[#edf7fe] dark:bg-[#262f49]">
      <Sidebar />

      <main className="min-w-0 flex-1 px-4 py-7 pt-20 sm:px-8 lg:pt-7">
        <div className="mt-4 flex flex-col items-stretch gap-6 lg:flex-row lg:gap-8">
          <div className="flex flex-1 flex-col justify-between">
            <h1 className="text-[26px] leading-[1.2] text-black dark:text-white sm:text-[40px] sm:leading-[1.15]">
              Selamat pagi/siang/malam,
              <br />
              <em className="font-bold italic">Lausa!</em>
            </h1>
            <ViewTransition
              name="main-card"
              default="block"
            >
            <Link
              href="/input-logbook"
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
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 shrink-0 rounded-full bg-current" />
                    Belum submit laporan
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 shrink-0 rounded-full bg-current" />
                    Terakhir: 4 Agustus 2026
                  </span>
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
          <ProgressCard title="Kehadiran di Bulan Ini" value="18 dari 20 hari" percent={90} />
          <ProgressCard title="Progress Magang" value="Bulan ke-3 dari 6 bulan" percent={90} />
        </div>

        <Stepper />
      </main>
    </div>
  );
}
