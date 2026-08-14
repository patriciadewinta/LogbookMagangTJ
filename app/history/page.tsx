import Sidebar from "@/components/sidebar";

const HISTORY_ITEMS = [
  {
    title: "Logbook Magang — Agustus 2026",
    file: "logbook_agustus_2026.pdf",
    date: "4 Agustus 2026",
    status: "disetujui",
  },
  {
    title: "Logbook Magang — Juli 2026",
    file: "logbook_juli_2026.pdf",
    date: "4 Juli 2026",
    status: "disetujui",
  },
  {
    title: "Logbook Magang — Juni 2026",
    file: "logbook_juni_2026.xlsx",
    date: "5 Juni 2026",
    status: "pending",
  },
];

const STATUS_STYLE: Record<string, string> = {
  disetujui: "bg-[#e3f6e8] text-[#147d2e] dark:bg-white/10 dark:text-[#5ee08a]",
  pending: "bg-[#fdf3dc] text-[#9a6b00] dark:bg-white/10 dark:text-[#ffd25e]",
  ditolak: "bg-[#fde3e3] text-[#b42318] dark:bg-white/10 dark:text-[#ff8a80]",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`shrink-0 rounded-[10px] px-4 py-1.5 text-[16px] font-semibold ${
        STATUS_STYLE[status] ?? STATUS_STYLE.ditolak
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function HistoryPage() {
  return (
    <div className="flex min-h-screen bg-[#edf7fe] dark:bg-[#262f49]">
      <Sidebar />

      <main className="min-w-0 flex-1 px-4 py-7 pt-20 sm:px-8 lg:pt-7">
        <h1 className="mt-4 text-[28px] leading-[1.15] text-black dark:text-white sm:text-[40px]">
          History Laporan
        </h1>
        <p className="mt-2 text-[18px] font-light leading-snug text-black dark:text-white sm:text-[20px]">
          Riwayat laporan magang yang sudah kamu submit
        </p>

        <div className="mt-8 flex flex-col gap-5">
          {HISTORY_ITEMS.map((item) => (
            <div
              key={item.title}
              className="flex flex-wrap items-center gap-4 rounded-[10px] border border-[#d9d9d9] bg-white p-4 sm:flex-nowrap sm:gap-5 sm:p-5 dark:border-white/10 dark:bg-black"
            >
              <div className="grid size-12 shrink-0 place-items-center rounded-[10px] bg-[#deedf8]">
                <img src="/assets/pdf-icon.png" alt="" className="size-10 object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[20px] font-semibold text-black dark:text-white">
                  {item.title}
                </p>
                <p className="mt-0.5 truncate text-[16px] text-black/30 dark:text-white/30">
                  {item.file} · {item.date}
                </p>
              </div>
              <StatusBadge status={item.status} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
