"use client";

import { useRef, useState } from "react";
import { ViewTransition } from "react";
import { useRouter } from "next/navigation";

function UploadBox({
  label,
  icon,
  accept,
  hint,
  fileName,
  onFile,
}: {
  label: string;
  icon: "pdf" | "debit";
  accept: string;
  hint: string;
  fileName: string;
  onFile: (name: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <p className="text-[20px] font-semibold text-black dark:text-white">{label}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-2 flex w-full cursor-pointer items-center gap-4 rounded-[10px] border border-dashed border-[#d9d9d9] bg-white px-3 py-4 text-left transition-colors hover:border-[#001192] dark:border-white/25 dark:bg-black dark:hover:border-[#4258ff]"
      >
        <div className="grid size-11 shrink-0 place-items-center rounded-[10px] bg-[#deedf8]">
          <img
            src={icon === "pdf" ? "/assets/pdf-icon.png" : "/assets/debit-card-icon.png"}
            alt=""
            className="size-9 object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[18px] text-black dark:text-white">
            {fileName || "Klik atau seret file di sini"}
          </p>
          <p className="truncate text-[14px] text-black/30 dark:text-white/30">{hint}</p>
        </div>
        <span className="shrink-0 rounded-[10px] bg-[#deedf8] px-4 py-1.5 text-[16px] font-light text-[#001192] dark:bg-white/10 dark:text-[#4258ff]">
          Pilih File
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file.name);
        }}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
}) {
  return (
    <div>
      <p className="text-[20px] font-semibold text-black dark:text-white">{label}</p>
      <div className="relative mt-2">
        <select
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
            <option key={opt} value={opt} className="text-black dark:bg-black dark:text-white">
              {opt}
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
  const router = useRouter();
  const [logbook, setLogbook] = useState("");
  const [ktm, setKtm] = useState("");
  const [pembimbing, setPembimbing] = useState("");
  const [kadep, setKadep] = useState("");
  const [kadiv, setKadiv] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/done-submit");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#edf7fe] px-4 py-16 dark:bg-[#262f49]">
      <div className="absolute left-[clamp(16px,4vw,102px)] top-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/")}
          aria-label="Kembali"
          title="Kembali"
          className="grid size-12 cursor-pointer place-items-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        >
          <img src="/assets/back-arrow.png" alt="" className="size-10 object-contain" />
        </button>
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
          Lengkapi data dan unggah logbook serta KTM untuk melengkapi report magang
        </p>

        <form onSubmit={onSubmit} className="mt-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
            <div className="flex flex-1 flex-col gap-6">
              <UploadBox
                label="Logbook Magang"
                icon="pdf"
                accept=".pdf,.xlsx,.csv"
                hint="Format PDF, XLSX, atau CSV, maks. 5MB"
                fileName={logbook}
                onFile={setLogbook}
              />
              <UploadBox
                label="Kartu Tanda Mahasiswa"
                icon="debit"
                accept=".pdf,.jpg,.jpeg,.png"
                hint="Format PDF, JPG, atau PNG, maks. 5MB"
                fileName={ktm}
                onFile={setKtm}
              />
            </div>

            <div className="flex flex-1 flex-col gap-5">
              <SelectField
                label="Nama Pembimbing"
                placeholder="Pilih Nama Pembimbing"
                value={pembimbing}
                onChange={setPembimbing}
                options={["Budi Santoso", "Siti Rahayu", "Andi Pratama"]}
              />
              <SelectField
                label="Nama Kepala Departemen"
                placeholder="Pilih Nama Kepala Departemen"
                value={kadep}
                onChange={setKadep}
                options={["Dewi Lestari", "Rizky Ananda", "Maya Putri"]}
              />
              <SelectField
                label="Nama Kepala Divisi"
                placeholder="Pilih Nama Kepala Divisi"
                value={kadiv}
                onChange={setKadiv}
                options={["Agus Wijaya", "Fajar Nugroho", "Nina Marlina"]}
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-8 block w-full cursor-pointer rounded-[10px] bg-[#001192] py-3 text-center text-[20px] font-bold text-white transition-opacity hover:opacity-90 dark:bg-[#4258ff]"
          >
            Upload Berkas
          </button>
        </form>
      </div>
      </ViewTransition>
    </div>
  );
}
