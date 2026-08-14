"use client";

import { useState } from "react";
import Sidebar from "@/components/sidebar";

function SettingField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <p className="text-[20px] font-semibold text-black dark:text-white">{label}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 h-11 w-full rounded-[10px] border border-[#d9d9d9] bg-white px-3 text-[16px] text-black outline-none transition-colors focus:border-[#001192] dark:border-white/25 dark:bg-black dark:text-white dark:focus:border-[#4258ff]"
      />
    </div>
  );
}

export default function SettingsPage() {
  const [nama, setNama] = useState("Lausa Pempruy");
  const [email, setEmail] = useState("sayaakanlawan@gmail.com");
  const [nim, setNim] = useState("2218123456");
  const [notif, setNotif] = useState(true);

  return (
    <div className="flex min-h-screen bg-[#edf7fe] dark:bg-[#262f49]">
      <Sidebar />

      <main className="min-w-0 flex-1 px-4 py-7 pt-20 sm:px-8 lg:pt-7">
        <h1 className="mt-4 text-[28px] leading-[1.15] text-black dark:text-white sm:text-[40px]">
          Settings
        </h1>
        <p className="mt-2 text-[18px] font-light leading-snug text-black dark:text-white sm:text-[20px]">
          Kelola profil dan preferensi akun kamu
        </p>

        <div className="mt-8 flex flex-col gap-5">
          <div className="rounded-[10px] border border-[#d9d9d9] bg-white p-6 dark:border-white/10 dark:bg-black">
            <p className="text-[24px] font-semibold text-black dark:text-white">
              Informasi Profil
            </p>
            <div className="mt-4 flex flex-col gap-5">
              <SettingField label="Nama Lengkap" value={nama} onChange={setNama} placeholder="Nama lengkap" />
              <SettingField label="Email" value={email} onChange={setEmail} placeholder="Email aktif" />
              <SettingField label="NIM" value={nim} onChange={setNim} placeholder="NIM" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-5 rounded-[10px] border border-[#d9d9d9] bg-white p-6 dark:border-white/10 dark:bg-black">
            <div>
              <p className="text-[20px] font-semibold text-black dark:text-white">
                Notifikasi Email
              </p>
              <p className="mt-0.5 text-[16px] text-black/30 dark:text-white/30">
                Terima notifikasi status laporan magang
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notif}
              onClick={() => setNotif((v) => !v)}
              className={`relative h-8 w-14 shrink-0 cursor-pointer rounded-full transition-colors ${
                notif ? "bg-[#0043ce]" : "bg-[#c6c6c6] dark:bg-white/20"
              }`}
            >
              <span
                className={`absolute top-1 size-6 rounded-full bg-white transition-all ${
                  notif ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>

          <button
            type="button"
            className="block w-full cursor-pointer rounded-[10px] bg-[#001192] py-3 text-center text-[20px] font-bold text-white transition-opacity hover:opacity-90 dark:bg-[#4258ff]"
          >
            Simpan Perubahan
          </button>
        </div>
      </main>
    </div>
  );
}
