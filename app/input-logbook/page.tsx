"use client";

import { useEffect, useRef, useState } from "react";
import { ViewTransition } from "react";
import Link from "next/link";
import { getApprovers, submitLogbook } from "@/app/actions";
import PageTransition from "@/components/page-transition";

type Approver = { id: string; name: string; role: string };

function UploadBox({
  label,
  accept,
  hint,
  file,
  inputName,
  onFile,
}: {
  label: string;
  accept: string;
  hint: string;
  file: File | null;
  inputName: string;
  onFile: (f: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <p className="text-[20px] font-semibold text-black dark:text-white">{label}</p>
      <div
        onClick={() => inputRef.current?.click()}
        className="mt-2 flex h-[76px] w-full max-w-full cursor-pointer items-center gap-4 overflow-hidden rounded-[10px] border border-dashed border-[#d9d9d9] bg-white px-3 py-4 text-left transition-colors hover:border-[#001192] dark:border-white/25 dark:bg-black dark:hover:border-[#4258ff]"
      >
        <div className="grid size-11 shrink-0 place-items-center rounded-[10px] bg-[#deedf8]">
          <img
            src="/assets/pdf-icon.png"
            alt=""
            className="size-9 object-contain"
          />
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="truncate whitespace-nowrap text-[18px] text-black dark:text-white" title={file?.name}>
            {file?.name || "Klik atau seret file di sini"}
          </p>
          <p className="truncate whitespace-nowrap text-[14px] text-black/30 dark:text-white/30">{hint}</p>
        </div>
        <span className="shrink-0 rounded-[10px] bg-[#deedf8] px-4 py-1.5 text-[16px] font-light text-[#001192] dark:bg-white/10 dark:text-[#4258ff]">
          Pilih File
        </span>
      </div>
      <input
        ref={inputRef}
        name={inputName}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
    </div>
  );
}

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
  const [logbook, setLogbook] = useState<File | null>(null);
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [pembimbing, setPembimbing] = useState("");
  const [kadep, setKadep] = useState("");
  const [kadiv, setKadiv] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("");
  const [hadirCount, setHadirCount] = useState("");
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await submitLogbook(new FormData(e.currentTarget as HTMLFormElement));
    if (res?.error) setError(res.error);
    setLoading(false);
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
          Upload your logbook!
        </h1>
        <p className="mt-2 max-w-[720px] text-[18px] font-light leading-snug text-black dark:text-white sm:text-[20px]">
          Unggah logbook dan pilih pembimbing, kepala departemen, serta kepala divisi untuk melengkapi report magang
        </p>

        <form onSubmit={onSubmit} className="mt-8">
          {error && (
            <p className="mb-5 rounded-[10px] border border-red-300 bg-red-50 px-3 py-2 text-[15px] text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
            <div className="flex flex-1 flex-col gap-5">
              <UploadBox
                label="Logbook Magang"
                accept=".pdf,.xlsx,.csv"
                hint="Format PDF, XLSX, atau CSV, maks. 1MB"
                file={logbook}
                inputName="logbook_file"
                onFile={setLogbook}
              />

              <div className="border-t border-[#e0e0e0] pt-5 dark:border-white/10">
                <p className="text-[20px] font-semibold text-black dark:text-white">Periode Logbook</p>
                <input
                  type="month"
                  name="period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="mt-2 h-11 w-full rounded-[10px] border border-[#d9d9d9] bg-white px-3 text-[16px] text-black outline-none transition-colors focus:border-[#001192] dark:border-white/25 dark:bg-black dark:text-white dark:focus:border-[#4258ff]"
                />
              </div>

              <div>
                <p className="text-[20px] font-semibold text-black dark:text-white">Jumlah Hari Hadir</p>
                <input
                  type="number"
                  name="hadir_count"
                  value={hadirCount}
                  onChange={(e) => setHadirCount(e.target.value)}
                  placeholder="Masukkan jumlah hari hadir"
                  min={0}
                  required
                  className="mt-2 h-11 w-full rounded-[10px] border border-[#d9d9d9] bg-white px-3 text-[16px] text-black outline-none transition-colors focus:border-[#001192] dark:border-white/25 dark:bg-black dark:text-white dark:focus:border-[#4258ff]"
                />
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
                <div className="flex flex-col gap-5">
                  <div>
                    <p className="text-[20px] font-semibold text-black dark:text-white">Jumlah Hari Cuti/Izin</p>
                    <input
                      type="number"
                      name="cuti_count"
                      min={0}
                      defaultValue={1}
                      className="mt-2 h-11 w-full rounded-[10px] border border-[#d9d9d9] bg-white px-3 text-[16px] text-black outline-none transition-colors focus:border-[#001192] dark:border-white/25 dark:bg-black dark:text-white dark:focus:border-[#4258ff]"
                    />
                  </div>
                  <div>
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
            </div>

            <div className="flex flex-1 flex-col gap-5">
              <SelectField
                label="Nama Pembimbing"
                name="pembimbing_id"
                placeholder="Pilih Nama Pembimbing"
                value={pembimbing}
                onChange={setPembimbing}
                options={byRole("pembimbing")}
              />
              <SelectField
                label="Nama Kepala Departemen"
                name="kadep_id"
                placeholder="Pilih Nama Kepala Departemen"
                value={kadep}
                onChange={setKadep}
                options={byRole("kadep")}
              />
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

          <button
            type="submit"
            disabled={loading}
            className="mt-8 block w-full cursor-pointer rounded-[10px] bg-[#001192] py-3 text-center text-[20px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-[#4258ff]"
          >
            {loading ? "Mengunggah..." : "Upload Berkas"}
          </button>
        </form>
      </div>
      </ViewTransition>
      </PageTransition>
    </div>
  );
}
