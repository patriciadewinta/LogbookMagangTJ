"use client";

import { useCallback, useEffect, useState } from "react";
import { ViewTransition } from "react";
import Link from "next/link";
import {
  deleteDailyActivity,
  getApprovers,
  getDailyActivities,
  saveDailyActivities,
  submitLogbook,
} from "@/app/actions";
import PageTransition from "@/components/page-transition";
import DatePicker from "@/components/date-picker";

type Approver = { id: string; name: string; role: string };

type Draft = { id: string; tanggal: string; kegiatan: string };

type Row = { key: string; dbId: string | null; tanggal: string; kegiatan: string };

const hariFmt = new Intl.DateTimeFormat("id-ID", { weekday: "long" });

let nextRowKey = 1;
function emptyRow(): Row {
  return { key: `local-${nextRowKey++}`, dbId: null, tanggal: "", kegiatan: "" };
}

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function hariLabel(tanggal: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) return "";
  const d = new Date(`${tanggal}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return hariFmt.format(d);
}

const STEPS = ["Kegiatan Harian", "Persetujuan"] as const;

function SelectField({
  label,
  name,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { id: string; name: string }[];
}) {
  return (
    <div>
      <p className="text-[20px] font-semibold text-black dark:text-white">{label}</p>
      <div className="relative mt-2">
        <select
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-11 w-full cursor-pointer appearance-none rounded-[10px] border border-[#d9d9d9] bg-white px-3 pr-9 text-[16px] outline-none transition-colors focus:border-[#001192] dark:border-white/25 dark:bg-black dark:focus:border-[#4258ff] ${
            value ? "text-black dark:text-white" : "text-black/30 dark:text-white/30"
          }`}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id} className="text-black dark:bg-black dark:text-white">
              {opt.name}
            </option>
          ))}
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
  );
}

export default function InputLogbookPage() {
  const [step, setStep] = useState(0);
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [pembimbing, setPembimbing] = useState("");
  const [kadep, setKadep] = useState("");
  const [kadiv, setKadiv] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [period, setPeriod] = useState("");
  const [today, setToday] = useState("");
  const [hasCuti, setHasCuti] = useState(false);

  const rebuildRows = useCallback((list: Draft[], p: string) => {
    const saved = list
      .filter((d) => d.tanggal.startsWith(p))
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
      .map((d) => ({ key: `db-${d.id}`, dbId: d.id, tanggal: d.tanggal, kegiatan: d.kegiatan }));
    setRows(saved.length > 0 ? [...saved, emptyRow()] : [emptyRow()]);
  }, []);

  useEffect(() => {
    const now = new Date();
    setPeriod(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    setToday(localToday());
    getApprovers().then((res) => {
      setApprovers(res.approvers);
    });
    getDailyActivities().then((res) => {
      setDrafts(res.activities);
    });
  }, []);

  // Ganti periode/drafts = tampilkan ulang draft bulan itu (derived state
  // saat render, bukan effect, biar tidak cascading render).
  const [rowsSync, setRowsSync] = useState<{ period: string; drafts: Draft[] } | null>(null);
  if (drafts && period && (rowsSync?.period !== period || rowsSync?.drafts !== drafts)) {
    setRowsSync({ period, drafts });
    rebuildRows(drafts, period);
  }

  const byRole = (role: string) =>
    approvers.filter((a) => a.role === role).map((a) => ({ id: a.id, name: a.name }));

  const draftsInPeriod = (drafts ?? []).filter((d) => period && d.tanggal.startsWith(period));
  const draftMap = new Map(draftsInPeriod.map((d) => [d.tanggal, d.kegiatan]));

  const filledRows = rows.filter((r) => r.tanggal && r.kegiatan.trim());
  const hasUnsavedChanges = filledRows.some((r) => draftMap.get(r.tanggal) !== r.kegiatan.trim());

  const updateRow = (key: string, patch: Partial<Row>) => {
    setRows((prev) => {
      const next = prev.map((r) => (r.key === key ? { ...r, ...patch } : r));
      // Auto-append row kosong saat baris terakhir terisi penuh.
      const last = next[next.length - 1];
      if (next.length < 32 && last && last.tanggal && last.kegiatan.trim()) {
        next.push(emptyRow());
      }
      return next;
    });
  };

  const removeRow = async (row: Row) => {
    setError(null);
    if (row.dbId) {
      const fd = new FormData();
      fd.set("id", row.dbId);
      const res = await deleteDailyActivity(fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setDrafts((prev) => (prev ? prev.filter((d) => d.id !== row.dbId) : prev));
    }
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== row.key) : [emptyRow()]));
  };

  const addRow = () => {
    setRows((prev) => (prev.length < 32 ? [...prev, emptyRow()] : prev));
  };

  const validateRows = () => {
    if (!period) {
      setError("Pilih periode logbook.");
      return false;
    }
    if (filledRows.length === 0) {
      setError("Isi minimal satu kegiatan harian.");
      return false;
    }
    const incomplete = rows.filter((r) => r.tanggal || r.kegiatan.trim());
    if (incomplete.some((r) => !r.tanggal || !r.kegiatan.trim())) {
      setError("Ada baris kegiatan yang belum lengkap (tanggal dan kegiatan wajib diisi).");
      return false;
    }
    if (filledRows.some((r) => !r.tanggal.startsWith(period))) {
      setError("Semua tanggal kegiatan harus dalam bulan periode logbook.");
      return false;
    }
    if (today && filledRows.some((r) => r.tanggal > today)) {
      setError("Tidak bisa mengisi kegiatan untuk tanggal yang belum lewat.");
      return false;
    }
    const dates = new Set(filledRows.map((r) => r.tanggal));
    if (dates.size !== filledRows.length) {
      setError("Ada tanggal yang dobel — satu tanggal cukup satu kegiatan.");
      return false;
    }
    return true;
  };

  const onSave = async () => {
    setError(null);
    setJustSaved(false);
    if (!validateRows()) return;

    setSaving(true);
    const fd = new FormData();
    fd.set(
      "entries",
      JSON.stringify(filledRows.map((r) => ({ tanggal: r.tanggal, kegiatan: r.kegiatan.trim() })))
    );
    const res = await saveDailyActivities(fd);
    if (res?.error) {
      setError(res.error);
      setSaving(false);
      return;
    }
    const refreshed = await getDailyActivities();
    setDrafts(refreshed.activities);
    setSaving(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  };

  const goNext = () => {
    setError(null);
    if (!validateRows()) return;
    if (draftsInPeriod.length === 0) {
      setError("Klik \"Simpan Kegiatan\" dulu sebelum lanjut.");
      return;
    }
    if (hasUnsavedChanges) {
      setError("Ada perubahan yang belum disimpan. Klik \"Simpan Kegiatan\" dulu.");
      return;
    }
    setStep(1);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!pembimbing || !kadep || !kadiv) {
      setError("Pilih pembimbing, kepala departemen, dan kepala divisi.");
      return;
    }

    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await submitLogbook(fd);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#edf7fe] px-4 py-16 dark:bg-[#262f49]">
      <PageTransition>
      <div className="absolute left-[clamp(16px,4vw,102px)] top-5 flex items-center gap-3">
        <Link
          href="/"
          transitionTypes={["nav-back"]}
          aria-label="Kembali"
          title="Kembali"
          className="grid size-12 place-items-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        >
          <img src="/assets/back-arrow.png" alt="" className="size-10 object-contain" />
        </Link>
        <ViewTransition name="logo-tj" default="block">
          <img
            src="/assets/logo-tj.png"
            alt="Logo Tj"
            className="size-14 rounded-[10px] object-cover dark:hidden"
          />
          <img
            src="/assets/logo-tj-dark.png"
            alt="Logo Tj"
            className="hidden size-14 rounded-[10px] object-cover dark:block"
          />
        </ViewTransition>
      </div>

      <ViewTransition
        name="main-card"
        default="block w-full max-w-[1026px]"
      >
      <div className="w-full max-w-[1026px] rounded-[10px] border border-[#d9d9d9] bg-white p-6 shadow-[0px_0px_48px_0px_rgba(0,0,0,0.35)] sm:p-10 dark:border-white/10 dark:bg-black">
        <h1 className="text-[28px] font-bold leading-tight text-black dark:text-white sm:text-[40px]">
          Isi logbook kamu!
        </h1>
        <p className="mt-2 max-w-[720px] text-[18px] font-light leading-snug text-black dark:text-white sm:text-[20px]">
          Catat kegiatan harian sesuai tanggal — otomatis tersimpan sebagai draft. Saat sudah
          lengkap satu bulan, lanjut kirim logbook untuk dibuat PDF.
        </p>

        {/* Progress steps */}
        <div className="mt-6 flex justify-center">
          <div className="flex w-full max-w-[560px] items-center gap-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex shrink-0 items-center gap-2">
                <div
                  className={`grid size-8 shrink-0 place-items-center rounded-full text-[15px] font-bold transition-colors ${
                    i < step
                      ? "bg-[#001192] text-white dark:bg-[#4258ff]"
                      : i === step
                        ? "border-2 border-[#001192] text-[#001192] dark:border-[#4258ff] dark:text-[#4258ff]"
                        : "border-2 border-[#d9d9d9] text-black/30 dark:border-white/25 dark:text-white/30"
                  }`}
                >
                  {i < step ? (
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`text-[15px] font-medium ${
                    i <= step ? "text-black dark:text-white" : "text-black/30 dark:text-white/30"
                  }`}
                >
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 rounded-full ${
                      i < step ? "bg-[#001192] dark:bg-[#4258ff]" : "bg-[#d9d9d9] dark:bg-white/25"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-8">
          {error && (
            <p className="mb-5 rounded-[10px] border border-red-300 bg-red-50 px-3 py-2 text-[15px] text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          {step === 0 ? (
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-[20px] font-semibold text-black dark:text-white">Periode Logbook</p>
                <input
                  type="month"
                  name="period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="mt-2 h-11 w-full max-w-[280px] rounded-[10px] border border-[#d9d9d9] bg-white px-3 text-[16px] text-black outline-none transition-colors focus:border-[#001192] dark:border-white/25 dark:bg-black dark:text-white dark:focus:border-[#4258ff]"
                />
              </div>

              <div className="border-t border-[#e0e0e0] pt-5 dark:border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[20px] font-semibold text-black dark:text-white">Kegiatan Harian</p>
                  <p className="rounded-[10px] bg-[#edf7fe] px-3 py-1.5 text-[15px] font-medium text-[#001192] dark:bg-white/10 dark:text-[#4258ff]">
                    Kegiatan tersimpan: {draftsInPeriod.length} hari
                  </p>
                </div>
                <div className="mt-2 flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-1">
                  {rows.map((r, i) => {
                    const saved = !!r.tanggal && draftMap.get(r.tanggal) === r.kegiatan.trim();
                    return (
                      <div
                        key={r.key}
                        className="rounded-[10px] border border-[#e0e0e0] bg-[#f8fbfe] p-3 dark:border-white/10 dark:bg-white/5"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-semibold text-[#001192] dark:text-[#4258ff]">
                            {i + 1}
                          </span>
                          <DatePicker
                            value={r.tanggal}
                            max={today || undefined}
                            onChange={(v) => updateRow(r.key, { tanggal: v })}
                            ariaLabel={`Tanggal kegiatan baris ${i + 1}`}
                            className="w-[225px] shrink-0"
                          />
                          <span className="min-w-[90px] text-[14px] text-black/50 dark:text-white/50">
                            {hariLabel(r.tanggal)}
                          </span>
                          {saved && (
                            <span className="hidden shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-[12px] font-semibold text-green-700 sm:inline dark:bg-green-950 dark:text-green-300">
                              Tersimpan
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeRow(r)}
                            disabled={rows.length === 1}
                            aria-label="Hapus baris"
                            title="Hapus baris"
                            className="ml-auto grid size-9 shrink-0 cursor-pointer place-items-center rounded-[10px] text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-red-950"
                          >
                            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                        <textarea
                          value={r.kegiatan}
                          onChange={(e) => updateRow(r.key, { kegiatan: e.target.value })}
                          placeholder="Tuliskan kegiatan pada hari ini"
                          rows={2}
                          maxLength={500}
                          className="mt-2 w-full resize-y rounded-[10px] border border-[#d9d9d9] bg-white px-3 py-2 text-[15px] text-black outline-none transition-colors focus:border-[#001192] dark:border-white/25 dark:bg-black dark:text-white dark:focus:border-[#4258ff]"
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={addRow}
                    disabled={rows.length >= 32}
                    className="cursor-pointer rounded-[10px] border border-[#001192] px-4 py-2 text-[15px] font-medium text-[#001192] transition-colors hover:bg-[#001192]/5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#4258ff] dark:text-[#4258ff] dark:hover:bg-[#4258ff]/10"
                  >
                    + Tambah Baris
                  </button>
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={saving}
                    className="cursor-pointer rounded-[10px] bg-[#001192] px-5 py-2 text-[15px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#4258ff]"
                  >
                    {saving ? "Menyimpan..." : "Simpan Kegiatan"}
                  </button>
                  {justSaved && (
                    <span className="text-[15px] font-semibold text-green-600 dark:text-green-400">
                      Kegiatan tersimpan ✓
                    </span>
                  )}
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 text-[18px] font-medium text-black dark:text-white">
                <input
                  type="checkbox"
                  name="has_cuti"
                  checked={hasCuti}
                  onChange={(e) => setHasCuti(e.target.checked)}
                  className="size-5 cursor-pointer accent-[#001192] dark:accent-[#4258ff]"
                />
                Saya ada cuti/izin di periode ini
              </label>

              {hasCuti && (
                <div className="flex flex-col gap-5 sm:flex-row">
                  <div className="flex-1">
                    <p className="text-[20px] font-semibold text-black dark:text-white">Jumlah Hari Cuti/Izin</p>
                    <input
                      type="number"
                      name="cuti_count"
                      min={0}
                      defaultValue={1}
                      className="mt-2 h-11 w-full rounded-[10px] border border-[#d9d9d9] bg-white px-3 text-[16px] text-black outline-none transition-colors focus:border-[#001192] dark:border-white/25 dark:bg-black dark:text-white dark:focus:border-[#4258ff]"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-[20px] font-semibold text-black dark:text-white">Alasan Cuti/Izin</p>
                    <input
                      type="text"
                      name="cuti_reason"
                      placeholder="Contoh: izin sakit, acara keluarga, dll."
                      className="mt-2 h-11 w-full rounded-[10px] border border-[#d9d9d9] bg-white px-3 text-[16px] text-black outline-none transition-colors focus:border-[#001192] dark:border-white/25 dark:bg-black dark:text-white dark:focus:border-[#4258ff]"
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={goNext}
                className="mt-3 block w-full cursor-pointer rounded-[10px] bg-[#001192] py-3 text-center text-[20px] font-bold text-white transition-opacity hover:opacity-90 dark:bg-[#4258ff]"
              >
                Lanjut Pilih Approver
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-5 lg:flex-row">
                <div className="flex flex-1 flex-col gap-5">
                  <SelectField
                    label="Nama Pembimbing"
                    name="pembimbing_id"
                    placeholder="Pilih Nama Pembimbing"
                    value={pembimbing}
                    onChange={setPembimbing}
                    options={byRole("pembimbing")}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-5">
                  <SelectField
                    label="Nama Kepala Departemen"
                    name="kadep_id"
                    placeholder="Pilih Nama Kepala Departemen"
                    value={kadep}
                    onChange={setKadep}
                    options={byRole("kadep")}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-5">
                  <SelectField
                    label="Nama Kepala Divisi"
                    name="kadiv_id"
                    placeholder="Pilih Nama Kepala Divisi"
                    value={kadiv}
                    onChange={setKadiv}
                    options={byRole("kadiv")}
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  disabled={loading}
                  className="cursor-pointer rounded-[10px] border border-[#001192] px-8 py-3 text-[18px] font-bold text-[#001192] transition-opacity hover:opacity-90 disabled:opacity-60 dark:border-[#4258ff] dark:text-[#4258ff]"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 cursor-pointer rounded-[10px] bg-[#001192] py-3 text-center text-[20px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-[#4258ff]"
                >
                  {loading ? "Membuat Logbook..." : "Buat & Kirim Logbook"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
      </ViewTransition>
      </PageTransition>
    </div>
  );
}
