"use client";

import { useEffect, useState } from "react";
import { ViewTransition } from "react";
import Link from "next/link";
import { getApprovers, submitLogbook } from "@/app/actions";
import PageTransition from "@/components/page-transition";

type Approver = { id: string; name: string; role: string };

type Entry = { id: number; tanggal: string; kegiatan: string };

const hariFmt = new Intl.DateTimeFormat("id-ID", { weekday: "long" });

let nextEntryId = 1;
function emptyEntry(): Entry {
  return { id: nextEntryId++, tanggal: "", kegiatan: "" };
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
  const [entries, setEntries] = useState<Entry[]>([emptyEntry()]);
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [pembimbing, setPembimbing] = useState("");
  const [kadep, setKadep] = useState("");
  const [kadiv, setKadiv] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("");
  const [hasCuti, setHasCuti] = useState(false);

  useEffect(() => {
    const now = new Date();
    setPeriod(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    getApprovers().then((res) => {
      setApprovers(res.approvers);
    });
  }, []);

  const byRole = (role: string) =>
    approvers.filter((a) => a.role === role).map((a) => ({ id: a.id, name: a.name }));

  // Hari hadir = akumulasi baris kegiatan yang terisi lengkap.
  const filledEntries = entries.filter((en) => en.tanggal && en.kegiatan.trim());

  const updateEntry = (id: number, patch: Partial<Entry>) => {
    setEntries((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, ...patch } : e));
      // Auto-append row kosong saat baris terakhir terisi penuh.
      const last = next[next.length - 1];
      if (next.length < 31 && last && last.tanggal && last.kegiatan.trim()) {
        next.push(emptyEntry());
      }
      return next;
    });
  };

  const removeEntry = (id: number) => {
    setEntries((prev) => (prev.length > 1 ? prev.filter((e) => e.id !== id) : prev));
  };

  const addEntry = () => {
    setEntries((prev) => (prev.length < 31 ? [...prev, emptyEntry()] : prev));
  };

  const validateStep1 = () => {
    if (!period) {
      setError("Pilih periode logbook.");
      return false;
    }
    if (filledEntries.length === 0) {
      setError("Isi minimal satu kegiatan harian.");
      return false;
    }
    const incomplete = entries.filter((en) => en.tanggal || en.kegiatan.trim());
    if (incomplete.some((en) => !en.tanggal || !en.kegiatan.trim())) {
      setError("Ada baris kegiatan yang belum lengkap (tanggal dan kegiatan wajib diisi).");
      return false;
    }
    return true;
  };

  const goNext = () => {
    setError(null);
    if (validateStep1()) setStep(1);
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
    fd.set(
      "entries",
      JSON.stringify(filledEntries.map((en) => ({ tanggal: en.tanggal, kegiatan: en.kegiatan.trim() })))
    );
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
          Masukkan kegiatan harian dan pilih approver — logbook PDF akan dibuat otomatis
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
                    Jumlah hari hadir: {filledEntries.length} (otomatis dari kegiatan)
                  </p>
                </div>
                <div className="mt-2 flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-1">
                  {entries.map((en, i) => (
                    <div
                      key={en.id}
                      className="rounded-[10px] border border-[#e0e0e0] bg-[#f8fbfe] p-3 dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-semibold text-[#001192] dark:text-[#4258ff]">
                          {i + 1}
                        </span>
                        <input
                          type="date"
                          value={en.tanggal}
                          onChange={(e) => updateEntry(en.id, { tanggal: e.target.value })}
                          className="h-11 w-full max-w-[180px] rounded-[10px] border border-[#d9d9d9] bg-white px-3 text-[16px] text-black outline-none transition-colors focus:border-[#001192] dark:border-white/25 dark:bg-black dark:text-white dark:focus:border-[#4258ff]"
                        />
                        <span className="min-w-[90px] text-[14px] text-black/50 dark:text-white/50">
                          {hariLabel(en.tanggal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeEntry(en.id)}
                          disabled={entries.length === 1}
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
                        value={en.kegiatan}
                        onChange={(e) => updateEntry(en.id, { kegiatan: e.target.value })}
                        placeholder="Tuliskan kegiatan pada hari ini"
                        rows={2}
                        maxLength={500}
                        className="mt-2 w-full resize-y rounded-[10px] border border-[#d9d9d9] bg-white px-3 py-2 text-[15px] text-black outline-none transition-colors focus:border-[#001192] dark:border-white/25 dark:bg-black dark:text-white dark:focus:border-[#4258ff]"
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addEntry}
                  disabled={entries.length >= 31}
                  className="mt-3 cursor-pointer rounded-[10px] border border-[#001192] px-4 py-2 text-[15px] font-medium text-[#001192] transition-colors hover:bg-[#001192]/5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#4258ff] dark:text-[#4258ff] dark:hover:bg-[#4258ff]/10"
                >
                  + Tambah Baris
                </button>
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
