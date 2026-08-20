"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { signUp } from "@/app/actions";
import PageTransition from "@/components/page-transition";
import { PROVINCES } from "@/lib/domisili";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(signUp, { error: null });
  const [ktmName, setKtmName] = useState("");
  const [domisili, setDomisili] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const ktmInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[#edf7fe] px-4 py-14 dark:bg-[#262f49]">
      <div className="absolute left-6 top-6">
        <img
          src="/assets/logo-tj.png"
          alt="Logo Tj"
          className="h-[64px] w-[64px] rounded-[10px] object-cover dark:hidden"
        />
        <img
          src="/assets/logo-tj-dark.png"
          alt="Logo Tj"
          className="hidden h-[64px] w-[64px] rounded-[10px] object-cover dark:block"
        />
      </div>

      <PageTransition>
      <h1 className="mb-6 text-[24px] font-bold text-black dark:text-white sm:text-[28px]">
        Registrasi Akun
      </h1>

      <div className="w-full max-w-[480px] rounded-[10px] border border-[#d9d9d9] bg-white p-5 shadow-[0_0_48px_0_rgba(0,0,0,0.35)] sm:p-8 dark:border-none dark:bg-black dark:shadow-[0_0_48px_0_rgba(0,0,0,0.35)]">
        <form action={formAction} className="flex flex-col gap-4">
          {state?.error && (
            <p className="rounded-[10px] border border-red-300 bg-red-50 px-3 py-2 text-[15px] text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {state.error}
            </p>
          )}
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-[17px] text-black dark:text-white"
            >
              Nama Lengkap
            </label>
            <input
              id="name"
              name="full_name"
              type="text"
              autoComplete="name"
              required
              className="h-9 w-full rounded-[10px] border border-[#d9d9d9] bg-white px-3 text-[17px] text-black outline-none placeholder:text-[15px] placeholder:font-medium placeholder:text-[rgba(0,0,0,0.16)] focus:border-[#001192] dark:border-[#d9d9d9] dark:focus:border-[#4258ff]"
            />
          </div>

          <div>
            <label
              htmlFor="university"
              className="mb-1.5 block text-[17px] text-black dark:text-white"
            >
              Universitas/Instansi
            </label>
            <input
              id="university"
              name="university"
              type="text"
              autoComplete="organization"
              required
              className="h-9 w-full rounded-[10px] border border-[#d9d9d9] bg-white px-3 text-[17px] text-black outline-none placeholder:text-[15px] placeholder:font-medium placeholder:text-[rgba(0,0,0,0.16)] focus:border-[#001192] dark:border-[#d9d9d9] dark:focus:border-[#4258ff]"
            />
          </div>

          <div>
            <label
              htmlFor="domisili"
              className="mb-1.5 block text-[17px] text-black dark:text-white"
            >
              Asal Domisili (Provinsi)
            </label>
            <div className="relative">
              <select
                id="domisili"
                name="domisili"
                value={domisili}
                onChange={(e) => setDomisili(e.target.value)}
                required
                className={`h-9 w-full cursor-pointer appearance-none rounded-[10px] border border-[#d9d9d9] bg-white px-3 pr-9 text-[17px] outline-none focus:border-[#001192] dark:border-[#d9d9d9] dark:bg-black dark:focus:border-[#4258ff] ${
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

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-[17px] text-black dark:text-white"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Example@gmail.com"
              autoComplete="email"
              required
              className="h-9 w-full rounded-[10px] border border-[#d9d9d9] bg-white px-3 text-[15px] font-medium text-black outline-none placeholder:text-[15px] placeholder:font-medium placeholder:text-[rgba(0,0,0,0.16)] focus:border-[#001192] dark:border-[#d9d9d9] dark:focus:border-[#4258ff]"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-[17px] text-black dark:text-white"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 8 Karakter"
                autoComplete="new-password"
                required
                minLength={8}
                className="h-9 w-full rounded-[10px] border border-[#d9d9d9] bg-white px-3 pr-10 text-[15px] font-medium text-black outline-none placeholder:text-[15px] placeholder:font-medium placeholder:text-[rgba(0,0,0,0.16)] focus:border-[#001192] dark:border-[#d9d9d9] dark:focus:border-[#4258ff]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              >
                <img
                  src={showPassword ? "/assets/eye.svg" : "/assets/eye-closed.svg"}
                  alt=""
                  className="size-5 object-contain"
                />
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-[17px] text-black dark:text-white"
            >
              Konfirmasi Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirm_password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Minimal 8 Karakter"
                autoComplete="new-password"
                required
                minLength={8}
                className="h-9 w-full rounded-[10px] border border-[#d9d9d9] bg-white px-3 pr-10 text-[15px] font-medium text-black outline-none placeholder:text-[15px] placeholder:font-medium placeholder:text-[rgba(0,0,0,0.16)] focus:border-[#001192] dark:border-[#d9d9d9] dark:focus:border-[#4258ff]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"}
                title={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"}
                className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              >
                <img
                  src={showConfirmPassword ? "/assets/eye.svg" : "/assets/eye-closed.svg"}
                  alt=""
                  className="size-5 object-contain"
                />
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="ktm"
              className="mb-1.5 block text-[17px] text-black dark:text-white"
            >
              Kartu Tanda Mahasiswa (KTM)
            </label>
            <button
              type="button"
              onClick={() => ktmInputRef.current?.click()}
              className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-[10px] border border-dashed border-[#d9d9d9] bg-white px-3 py-3 text-left transition-colors hover:border-[#001192] dark:border-white/25 dark:bg-black dark:hover:border-[#4258ff]"
            >
              <span
                className={`truncate text-[15px] ${
                  ktmName
                    ? "font-medium text-black dark:text-white"
                    : "text-black/40 dark:text-white/40"
                }`}
              >
                {ktmName || "Pilih file KTM (PDF, JPG, PNG — maks. 1MB)"}
              </span>
              <span className="shrink-0 rounded-[10px] bg-[#deedf8] px-3 py-1 text-[14px] font-light text-[#001192] dark:bg-white/10 dark:text-[#4258ff]">
                Pilih File
              </span>
            </button>
            <input
              ref={ktmInputRef}
              id="ktm"
              name="ktm_file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => setKtmName(e.target.files?.[0]?.name ?? "")}
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-[10px] bg-[#001192] py-3 text-[17px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-[#4258ff]"
          >
            {pending ? "Membuat Akun..." : "Buat Akun"}
          </button>
        </form>
      </div>

      <p className="mt-5 text-center text-[17px] text-black dark:text-white">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          transitionTypes={["nav-back"]}
          className="font-bold text-[#001192] dark:text-[#4258ff]"
        >
          Login
        </Link>
      </p>
      </PageTransition>
    </div>
  );
}
