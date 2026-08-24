"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteHoliday, saveHoliday } from "@/app/actions";
import { usePopup } from "@/components/popup";
import { useToast } from "@/components/toast-provider";

export type HolidayRow = {
  date: string;
  name: string;
  type: string;
  isLibur: boolean;
  year: number;
};

const TABS = [
  { key: "all", label: "Semua" },
  { key: "libur_nasional", label: "Libur Nasional" },
  { key: "cuti_bersama", label: "Cuti Bersama" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const inputClass =
  "h-9 w-full rounded-[10px] border border-[#d9d9d9] bg-white px-3 text-[15px] text-black outline-none focus:border-[#001192] dark:border-[#d9d9d9] dark:bg-black dark:text-white dark:focus:border-[#4258ff]";
const labelClass = "mb-1 block text-[15px] text-black dark:text-white";

type ModalState = { mode: "add" } | { mode: "edit"; holiday: HolidayRow } | null;

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function formatDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return `${DAY_NAMES[dow]}, ${d} ${MONTHS[m - 1]} ${y}`;
}

export default function HolidayTabs({ holidays }: { holidays: HolidayRow[] }) {
  const router = useRouter();
  const { confirm } = usePopup();
  const toast = useToast();
  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("all");
  const [yearOpen, setYearOpen] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [busy, setBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState<string | null>(null);
  const [type, setType] = useState("libur_nasional");
  const [isLiburChecked, setIsLiburChecked] = useState(true);

  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => [...new Set([...holidays.map((h) => h.year), currentYear])].sort((a, b) => b - a),
    [holidays, currentYear]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return holidays
      .filter((h) => (tab === "all" || h.type === tab))
      .filter((h) => year === "all" || h.year === Number(year))
      .filter((h) => !q || h.name.toLowerCase().includes(q) || formatDate(h.date).toLowerCase().includes(q))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [holidays, tab, year, query]);

  function openAdd() {
    setType("libur_nasional");
    setIsLiburChecked(true);
    setModal({ mode: "add" });
  }

  function openEdit(holiday: HolidayRow) {
    setType(holiday.type);
    setIsLiburChecked(holiday.isLibur);
    setModal({ mode: "edit", holiday });
  }

  function closeModal() {
    if (busy) return;
    setModal(null);
  }

  async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const fd = new FormData(e.currentTarget);
    if (modal?.mode === "edit") fd.set("original_date", modal.holiday.date);

    // Validasi akhir pekan di client dulu biar responsif.
    const date = String(fd.get("date") ?? "");
    const [y, m, d] = date.split("-").map(Number);
    const dow = new Date(y, m - 1, d).getDay();
    if (dow === 0 || dow === 6) {
      toast.warning("Tanggal jatuh di Sabtu/Minggu — akhir pekan sudah pasti libur.");
      return;
    }

    setBusy(true);
    const res = await saveHoliday({ error: null }, fd);
    setBusy(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(modal?.mode === "edit" ? "Perubahan hari libur tersimpan." : "Hari libur ditambahkan.");
      setModal(null);
      router.refresh();
    }
  }

  async function handleDelete(holiday: HolidayRow) {
    if (deleteBusy) return;
    const ok = await confirm({
      title: "Hapus Hari Libur",
      message: `Hapus "${holiday.name}" (${formatDate(holiday.date)})?`,
      confirmLabel: "Hapus",
      danger: true,
    });
    if (!ok) return;
    setDeleteBusy(holiday.date);
    const fd = new FormData();
    fd.set("date", holiday.date);
    const res = await deleteHoliday(fd);
    setDeleteBusy(null);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(`${holiday.name} dihapus.`);
      router.refresh();
    }
  }

  const folderTab = (t: (typeof TABS)[number]) =>
    `flex h-9 shrink-0 items-center rounded-t-[10px] border border-b-0 px-4 text-[12px] transition-colors sm:h-10 sm:px-[26px] sm:text-[13px] ${
      tab === t.key
        ? "border-[#e6ebf1] bg-white font-bold text-[#15588e] shadow-[0_-3px_10px_rgba(22,73,116,0.04)] dark:border-white/10 dark:bg-[#2a3350] dark:text-[#8fb8ff]"
        : "border-[#e6ebf1] bg-[#eef1f5] font-semibold text-[#8a93a0] hover:text-[#15588e] dark:border-white/10 dark:bg-[#1f2840] dark:text-white/50 dark:hover:text-[#8fb8ff]"
    }`;

  const thCls = "h-[46px] px-[25px] text-left text-[13px] font-[650] text-[#657080]";
  const tdCls = "h-[42px] px-[25px] text-[12px] text-[#4e5968] whitespace-nowrap";
  const rowCls = "border-b border-[#edf0f3] last:border-b-0 hover:bg-[#fbfdff]";

  const selectedYearLabel = year === "all" ? "Semua Tahun" : year;

  return (
    <div className="relative mt-8">
      {/* Folder header: tab tipe (kiri) + search, filter tahun & tombol tambah (kanan) */}
      <div className="-mb-px flex items-end justify-between gap-3">
        <div className="flex min-w-0 items-end gap-1.5 overflow-x-auto pl-[18px]">
          {TABS.map((t) => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)} className={folderTab(t)}>
              {t.label}
            </button>
          ))}
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
              onClick={() => setYearOpen((o) => !o)}
              className="flex h-9 min-h-9 w-[42px] min-w-[42px] items-center justify-center gap-2 rounded-[7px] border border-[#e6ebf1] bg-[#eef1f5] px-0 text-[13px] text-[#65748a] transition-colors hover:border-[#a9c8de] hover:text-[#15588e] sm:h-10 sm:w-auto sm:min-w-[120px] sm:px-[13px] dark:border-white/10 dark:bg-[#1f2840] dark:text-[#a9c8de]"
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
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              <span className="hidden text-[#65748a] sm:inline dark:text-[#a9c8de]">
                {selectedYearLabel}
              </span>
            </button>

            {yearOpen && (
              <>
                <div className="fixed inset-0 z-[2]" onClick={() => setYearOpen(false)} />
                <div className="absolute right-0 top-[47px] z-[3] w-[130px] rounded-[7px] border border-[#e7edf3] bg-white p-1.5 dark:border-white/10 dark:bg-black">
                  <button
                    type="button"
                    onClick={() => {
                      setYear("all");
                      setYearOpen(false);
                    }}
                    className={`w-full rounded px-2.5 py-[9px] text-left text-[12px] transition-colors ${
                      year === "all"
                        ? "bg-[#eef7fb] text-[#15588e]"
                        : "text-[#526276] hover:bg-[#eef7fb] hover:text-[#15588e] dark:text-white/70 dark:hover:bg-white/10"
                    }`}
                  >
                    Semua Tahun
                  </button>
                  {years.map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        setYear(String(y));
                        setYearOpen(false);
                      }}
                      className={`w-full rounded px-2.5 py-[9px] text-left text-[12px] transition-colors ${
                        year === String(y)
                          ? "bg-[#eef7fb] text-[#15588e]"
                          : "text-[#526276] hover:bg-[#eef7fb] hover:text-[#15588e] dark:text-white/70 dark:hover:bg-white/10"
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={openAdd}
            title="Tambah Hari Libur"
            className="flex h-9 min-h-9 items-center gap-2 rounded-[7px] bg-[#5E46FF] px-3 text-[12px] font-bold text-white transition-opacity hover:opacity-90 sm:h-10 sm:px-4 sm:text-[13px]"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="hidden sm:inline">Tambah</span>
          </button>
        </div>
      </div>

      {/* Kotak folder */}
      <div className="overflow-hidden rounded-b-[12px] border border-[#e6ebf1] bg-white shadow-[0_6px_20px_rgba(22,73,116,0.08)] dark:border-white/10 dark:bg-[#2a3350]">
        <div className="overflow-x-auto">
          {filtered.length > 0 ? (
            <table className="w-full min-w-[700px] table-fixed border-collapse text-left">
              <thead>
                <tr className="bg-[#f6f2fb]">
                  <th className={`${thCls} w-[32%]`}>Tanggal</th>
                  <th className={`${thCls} w-[38%]`}>Nama Hari</th>
                  <th className={`${thCls} w-[15%]`}>Status</th>
                  <th className={`${thCls} w-[15%]`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((h) => (
                  <tr key={h.date} className={rowCls}>
                    <td className={tdCls}>
                      <div className="flex items-center gap-2.5">
                        <div className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-[#f0e9ff] text-[13px] font-bold text-[#5b21b6] dark:bg-white/10 dark:text-[#c4b5fd]">
                          {Number(h.date.slice(8, 10))}
                        </div>
                        <span className="truncate font-medium text-[#4e5968] dark:text-white">
                          {formatDate(h.date)}
                        </span>
                      </div>
                    </td>
                    <td className={tdCls}>{h.name}</td>
                    <td className={tdCls}>
                      {h.type === "cuti_bersama" ? (
                        <span
                          className={`inline-flex min-h-6 items-center rounded-[5px] px-[11px] text-[11px] font-[650] ${
                            h.isLibur
                              ? "bg-[#f0e9ff] text-[#5b21b6] dark:bg-white/10 dark:text-[#c4b5fd]"
                              : "bg-[#fdf3dc] text-[#9a6b00] dark:bg-white/10 dark:text-[#ffd25e]"
                          }`}
                        >
                          {h.isLibur ? "Cuti Bersama" : "Tetap Masuk"}
                        </span>
                      ) : (
                        <span className="inline-flex min-h-6 items-center rounded-[5px] bg-[#e3f6e8] px-[11px] text-[11px] font-[650] text-[#147d2e] dark:bg-white/10 dark:text-[#5ee08a]">
                          Libur Nasional
                        </span>
                      )}
                    </td>
                    <td className={tdCls}>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(h)}
                          title="Edit"
                          aria-label={`Edit ${h.name}`}
                          className="grid size-8 cursor-pointer place-items-center rounded-[8px] text-[#001192] transition-colors hover:bg-[#deedf8] dark:text-[#4258ff] dark:hover:bg-white/10"
                        >
                          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
                            <path
                              d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(h)}
                          disabled={deleteBusy === h.date}
                          title="Hapus"
                          aria-label={`Hapus ${h.name}`}
                          className="grid size-8 cursor-pointer place-items-center rounded-[8px] text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-white/10"
                        >
                          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
                            <path
                              d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-[25px] py-[42px] text-center text-[13px] text-[#8491a1]">
              Belum ada hari libur yang cocok.
            </p>
          )}
        </div>
      </div>

      {/* Modal tambah/edit */}
      {modal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={closeModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[10px] border border-[#d9d9d9] bg-white p-5 shadow-[0_0_48px_0_rgba(0,0,0,0.35)] dark:border-white/10 dark:bg-black sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[20px] font-bold text-black dark:text-white">
                {modal.mode === "add" ? "Tambah Hari Libur" : "Edit Hari Libur"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Tutup"
                className="grid size-8 cursor-pointer place-items-center rounded-full text-black/60 transition-colors hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/10"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <p className="mb-4 text-[13px] text-[#8491a1]">
              Sabtu dan Minggu tidak perlu didaftarkan — otomatis dihitung libur.
            </p>

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="hl-name" className={labelClass}>
                  Nama Hari
                </label>
                <input
                  id="hl-name"
                  name="name"
                  type="text"
                  required
                  defaultValue={modal.mode === "edit" ? modal.holiday.name : ""}
                  placeholder="Contoh: Hari Pahlawan"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="hl-date" className={labelClass}>
                  Tanggal
                </label>
                <input
                  id="hl-date"
                  name="date"
                  type="date"
                  required
                  defaultValue={modal.mode === "edit" ? modal.holiday.date : ""}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="hl-type" className={labelClass}>
                  Tipe
                </label>
                <div className="relative">
                  <select
                    id="hl-type"
                    name="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className={`${inputClass} cursor-pointer appearance-none pr-9`}
                  >
                    <option value="libur_nasional">Libur Nasional</option>
                    <option value="cuti_bersama">Cuti Bersama</option>
                  </select>
                  <svg
                    viewBox="0 0 24 24"
                    className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-black/50 dark:text-white/50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              {type === "cuti_bersama" && (
                <label className="flex cursor-pointer items-center gap-3 text-[15px] text-black dark:text-white">
                  <input
                    type="checkbox"
                    name="is_libur"
                    checked={isLiburChecked}
                    onChange={(e) => setIsLiburChecked(e.target.checked)}
                    className="size-4 cursor-pointer accent-[#001192] dark:accent-[#4258ff]"
                  />
                  Dihitung sebagai hari libur (hilangkan centang bila tetap masuk)
                </label>
              )}
              <button
                type="submit"
                disabled={busy}
                className="mt-2 w-full rounded-[10px] bg-[#5E46FF] py-3 text-[16px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? "Menyimpan..." : "Simpan"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
