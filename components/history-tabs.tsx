"use client";

import { useMemo, useState } from "react";
import DownloadButton from "@/components/download-button";

export type HistoryItem = {
  id: string;
  logbookFilePath: string;
  signedFilePath: string | null;
  status: string;
  rejectionReason: string | null;
  createdAt: Date;
  paymentStatus: string | null;
  paymentAmount: number | null;
  paidAt: Date | null;
  periodYear: number | null;
  periodMonth: number | null;
  hadirCount: number | null;
  cutiCount: number | null;
};

const STATUS_LABEL: Record<string, string> = {
  submitted: "Pending",
  pembimbing_approved: "Disetujui Pembimbing",
  kadep_approved: "Disetujui Kadep",
  kadiv_approved: "Disetujui Kadep/Kadiv",
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
      className={`inline-flex min-h-6 items-center rounded-[5px] px-[11px] text-[11px] font-[650] ${
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
const timeFmt = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
});
const monthYearFmt = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" });
const rupiah = new Intl.NumberFormat("id-ID");

function monthKey(item: HistoryItem) {
  if (item.periodYear && item.periodMonth) {
    return `${item.periodYear}-${String(item.periodMonth).padStart(2, "0")}`;
  }
  const d = new Date(item.createdAt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function HistoryTabs({ submissions }: { submissions: HistoryItem[] }) {
  const [tab, setTab] = useState<"semua" | "uangSaku">("semua");
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState("all");
  const [monthOpen, setMonthOpen] = useState(false);

  const months = useMemo(() => {
    return [...new Set(submissions.map(monthKey))]
      .sort((a, b) => b.localeCompare(a));
  }, [submissions]);

  const filtered = submissions.filter((item) => {
    if (month !== "all" && monthKey(item) !== month) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    if (tab === "semua") {
      return (item.logbookFilePath.split("/").pop() ?? "").toLowerCase().includes(q);
    }
    const status = item.paymentStatus ? "sudah dibayar" : "belum dibayar";
    const d = new Date(item.createdAt);
    return `${dateFmt.format(d)} ${status}`.toLowerCase().includes(q);
  });

  const selectedMonthLabel =
    month === "all"
      ? "Semua Bulan"
      : (() => {
          const [y, mo] = month.split("-").map(Number);
          return monthYearFmt.format(new Date(y, mo - 1, 1));
        })();

  const folderTab = (t: "semua" | "uangSaku") =>
    `flex h-9 shrink-0 items-center rounded-t-[10px] border border-b-0 px-4 text-[12px] transition-colors sm:h-10 sm:px-[26px] sm:text-[13px] ${
      tab === t
        ? "border-[#e6ebf1] bg-white font-bold text-[#15588e] shadow-[0_-3px_10px_rgba(22,73,116,0.04)] dark:border-white/10 dark:bg-[#2a3350] dark:text-[#8fb8ff]"
        : "border-[#e6ebf1] bg-[#eef1f5] font-semibold text-[#8a93a0] hover:text-[#15588e] dark:border-white/10 dark:bg-[#1f2840] dark:text-white/70 dark:hover:text-[#8fb8ff]"
    }`;

  const thCls = "h-[46px] px-[25px] text-left text-[13px] font-[650] text-[#657080]";
  const tdCls = "h-[42px] px-[25px] text-[12px] text-[#4e5968] whitespace-nowrap";
  const rowCls = "border-b border-[#edf0f3] last:border-b-0 hover:bg-[#fbfdff]";

  return (
    <div className="relative mt-8">
      {/* Folder header: tab (kiri) + search & filter bulan (kanan), satu baris */}
      <div className="-mb-px flex items-end justify-between gap-3">
        <div className="flex min-w-0 items-end gap-1.5 overflow-x-auto pl-[18px]">
          <button type="button" onClick={() => setTab("semua")} className={folderTab("semua")}>
            Semua
          </button>
          <button type="button" onClick={() => setTab("uangSaku")} className={folderTab("uangSaku")}>
            Uang Saku
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2.5 pr-2 sm:pr-1">
          <label className="flex h-9 w-28 items-center gap-2.5 rounded-[7px] border border-[#e6ebf1] bg-[#eef1f5] px-[13px] text-[#9ba8b8] sm:h-10 sm:w-[200px] dark:border-white/10 dark:bg-[#1f2840]">
            <svg
              viewBox="0 0 24 24"
              className="size-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-full bg-transparent text-[13px] text-[#39485b] outline-none placeholder:text-[#aeb8c4] dark:text-white dark:placeholder:text-white/40"
            />
          </label>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMonthOpen((o) => !o)}
              className="flex h-9 w-[42px] min-w-[42px] items-center justify-center gap-2 rounded-[7px] border border-[#e6ebf1] bg-[#eef1f5] px-0 text-[13px] text-[#65748a] transition-colors hover:border-[#a9c8de] hover:text-[#15588e] sm:h-10 sm:w-auto sm:min-w-[145px] sm:px-[13px] dark:border-white/10 dark:bg-[#1f2840] dark:text-[#a9c8de]"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-4 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 4h18M6 9h12M10 14h4" />
              </svg>
              <span className="hidden text-[#65748a] sm:inline dark:text-[#a9c8de]">
                {selectedMonthLabel}
              </span>
            </button>

            {monthOpen && (
              <>
                <div className="fixed inset-0 z-[2]" onClick={() => setMonthOpen(false)} />
                <div className="absolute right-0 top-[47px] z-[3] w-[155px] rounded-[7px] border border-[#e7edf3] bg-white p-1.5 dark:border-white/10 dark:bg-black">
                  <button
                    type="button"
                    onClick={() => {
                      setMonth("all");
                      setMonthOpen(false);
                    }}
                    className={`w-full rounded px-2.5 py-[9px] text-left text-[12px] transition-colors ${
                      month === "all"
                        ? "bg-[#eef7fb] text-[#15588e]"
                        : "text-[#526276] hover:bg-[#eef7fb] hover:text-[#15588e] dark:text-white/70 dark:hover:bg-white/10"
                    }`}
                  >
                    Semua Bulan
                  </button>
                  {months.map((m) => {
                    const [y, mo] = m.split("-").map(Number);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setMonth(m);
                          setMonthOpen(false);
                        }}
                        className={`w-full rounded px-2.5 py-[9px] text-left text-[12px] transition-colors ${
                          month === m
                            ? "bg-[#eef7fb] text-[#15588e]"
                            : "text-[#526276] hover:bg-[#eef7fb] hover:text-[#15588e] dark:text-white/70 dark:hover:bg-white/10"
                        }`}
                      >
                        {monthYearFmt.format(new Date(y, mo - 1, 1))}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Kotak folder (liquid glass) */}
      <div className="overflow-hidden rounded-b-[12px] border border-[#e6ebf1] bg-white shadow-[0_6px_20px_rgba(22,73,116,0.08)] dark:border-white/10 dark:bg-[#2a3350]">

        {/* Tabel */}
        <div className="overflow-x-auto">
          {tab === "semua" ? (
            filtered.length > 0 ? (
              <table className="w-full min-w-[700px] table-fixed border-collapse text-left">
                <thead>
                  <tr className="bg-[#f6f2fb]">
                    <th className={`${thCls} w-[18%]`}>Tanggal</th>
                    <th className={`${thCls} w-[47%]`}>Nama File</th>
                    <th className={`${thCls} w-[25%]`}>Status</th>
                    <th className={`${thCls} w-[10%]`}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const file = item.logbookFilePath.split("/").pop() ?? "";
                    return (
                      <tr key={item.id} className={rowCls}>
                        <td className={tdCls}>{dateFmt.format(new Date(item.createdAt))}</td>
                        <td className={tdCls}>
                          <div className="flex items-center gap-2.5">
                            <div className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-[#deedf8]">
                              <img src="/assets/pdf-icon.png" alt="" className="size-6 object-contain" />
                            </div>
                            <span className="truncate font-medium text-[#4e5968]">{file}</span>
                          </div>
                        </td>
                        <td className={tdCls}>
                          <StatusBadge status={item.status} />
                        </td>
                        <td className={tdCls}>
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
                            iconOnly
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="px-[25px] py-[42px] text-center text-[13px] text-[#8491a1]">
                Belum ada laporan yang cocok.
              </p>
            )
          ) : filtered.length > 0 ? (
            <table className="w-full min-w-[700px] table-fixed border-collapse text-left">
              <thead>
                <tr className="bg-[#f6f2fb]">
                  {["Tanggal", "Waktu", "Total Hari Masuk", "Total Hari Cuti/Izin", "Status"].map((h) => (
                    <th key={h} className={thCls}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const paid = !!item.paymentStatus;
                  return (
                    <tr key={item.id} className={rowCls}>
                      <td className={tdCls}>{dateFmt.format(new Date(item.createdAt))}</td>
                      <td className={tdCls}>{item.paidAt ? timeFmt.format(new Date(item.paidAt)) : ""}</td>
                      <td className={tdCls}>{item.hadirCount ?? "—"}</td>
                      <td className={tdCls}>{item.cutiCount ?? "—"}</td>
                      <td className={tdCls}>
                        {paid && (
                          <>
                            <span className="inline-flex min-h-6 items-center rounded-[5px] px-[11px] text-[11px] font-[650] bg-[#00D800] text-white">
                              Sudah Dibayar
                            </span>
                            {item.paymentAmount != null && (
                              <p className="mt-1 text-[12px] text-[#8491a1]">
                                Rp {rupiah.format(item.paymentAmount)}
                              </p>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="px-[25px] py-[42px] text-center text-[13px] text-[#8491a1]">
              Belum ada laporan yang cocok.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
