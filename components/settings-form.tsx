"use client";

import { useActionState, useRef, useState } from "react";
import { updateProfile, uploadAvatar, removeAvatar } from "@/app/actions";
import { PROVINCES } from "@/lib/domisili";

export type SettingsInitial = {
  fullName: string;
  email: string;
  university: string;
  domisili: string;
  posisi: string;
  phone: string;
  avatarPath: string | null;
  emailNotif: boolean;
};

function SettingField({
  label,
  name,
  value,
  onChange,
  placeholder,
  readOnly,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <p className="text-[20px] font-semibold text-black dark:text-white">{label}</p>
      <input
        type="text"
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className="mt-2 h-11 w-full rounded-[10px] border border-[#d9d9d9] bg-white px-3 text-[16px] outline-none transition-colors focus:border-[#001192] read-only:cursor-not-allowed read-only:text-black/40 dark:border-white/25 dark:bg-black dark:text-white dark:focus:border-[#4258ff] dark:read-only:text-white/40"
      />
    </div>
  );
}

export default function SettingsForm({ initial }: { initial: SettingsInitial }) {
  const [nama, setNama] = useState(initial.fullName);
  const [posisi, setPosisi] = useState(initial.posisi);
  const [university, setUniversity] = useState(initial.university);
  const [domisili, setDomisili] = useState(initial.domisili);
  const [phone, setPhone] = useState(initial.phone);
  const [notif, setNotif] = useState(initial.emailNotif);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [avatarState, avatarAction, avatarPending] = useActionState(uploadAvatar, {
    error: null,
  });
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const avatarUrl = initial.avatarPath
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${initial.avatarPath}`
    : null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await updateProfile(new FormData(e.currentTarget as HTMLFormElement));
    if (res?.error) setError(res.error);
    setLoading(false);
  };

  return (
    <>
      <div className="mt-8 rounded-[10px] border border-[#d9d9d9] bg-white p-6 dark:border-white/10 dark:bg-black">
        <p className="text-[24px] font-semibold text-black dark:text-white">Foto Profil</p>
        <div className="mt-4 flex items-center gap-5">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Foto profil"
              className="size-20 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="grid size-20 shrink-0 place-items-center rounded-full bg-[#001192] text-[28px] font-bold text-white dark:bg-[#4258ff]">
              {(nama || "P").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <form action={avatarAction}>
              <input
                ref={avatarInputRef}
                type="file"
                name="avatar_file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => e.currentTarget.form?.requestSubmit()}
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarPending}
                className="w-fit cursor-pointer rounded-[10px] bg-[#001192] px-5 py-2.5 text-[16px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-[#4258ff]"
              >
                {avatarPending ? "Mengunggah..." : "Ganti Foto"}
              </button>
            </form>
            {avatarUrl && (
              <form action={removeAvatar}>
                <button
                  type="submit"
                  className="w-fit cursor-pointer rounded-[10px] border border-[#d9d9d9] px-5 py-2.5 text-[16px] font-bold text-black transition-colors hover:border-red-300 hover:text-red-600 dark:border-white/25 dark:text-white dark:hover:border-red-900 dark:hover:text-red-300"
                >
                  Hapus Foto
                </button>
              </form>
            )}
          </div>
        </div>
        {avatarState?.error && (
          <p className="mt-3 text-[15px] text-red-600 dark:text-red-300">
            {avatarState.error}
          </p>
        )}
      </div>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
        <input type="hidden" name="email_notif" value={notif ? "on" : ""} />
        {error && (
          <p className="rounded-[10px] border border-red-300 bg-red-50 px-3 py-2 text-[15px] text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="rounded-[10px] border border-[#d9d9d9] bg-white p-6 dark:border-white/10 dark:bg-black">
          <p className="text-[24px] font-semibold text-black dark:text-white">
            Informasi Profil
          </p>
          <div className="mt-4 flex flex-col gap-5">
            <SettingField label="Nama Lengkap" name="full_name" value={nama} onChange={setNama} placeholder="Nama lengkap" />
            <SettingField label="Email" name="email" value={initial.email} onChange={() => {}} placeholder="Email aktif" readOnly />
            <SettingField label="Posisi" name="posisi" value={posisi} onChange={setPosisi} placeholder="Posisi magang (contoh: Software Developer)" />
            <SettingField label="Universitas/Instansi" name="university" value={university} onChange={setUniversity} placeholder="Universitas/Instansi" />
            <div>
              <p className="text-[20px] font-semibold text-black dark:text-white">
                Asal Daerah
              </p>
              <div className="relative mt-2">
                <select
                  name="domisili"
                  value={domisili}
                  onChange={(e) => setDomisili(e.target.value)}
                  required
                  className={`h-11 w-full cursor-pointer appearance-none rounded-[10px] border border-[#d9d9d9] bg-white px-3 pr-9 text-[16px] outline-none transition-colors focus:border-[#001192] dark:border-white/25 dark:bg-black dark:focus:border-[#4258ff] ${
                    domisili
                      ? "text-black dark:text-white"
                      : "text-black/40 dark:text-white/40"
                  }`}
                >
                  <option value="" disabled>
                    Pilih Provinsi Asal
                  </option>
                  {PROVINCES.map((p) => (
                    <option
                      key={p}
                      value={p}
                      className="text-black dark:bg-black dark:text-white"
                    >
                      {p}
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
            <SettingField label="Nomor Telepon" name="phone" value={phone} onChange={setPhone} placeholder="Nomor telepon" />
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
          type="submit"
          disabled={loading}
          className="block w-full cursor-pointer rounded-[10px] bg-[#001192] py-3 text-center text-[20px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-[#4258ff]"
        >
          {loading ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </form>
    </>
  );
}
