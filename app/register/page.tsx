"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire ke auth API
  };

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

      <h1 className="mb-6 text-[24px] font-bold text-black dark:text-white sm:text-[28px]">
        Registrasi Akun
      </h1>

      <div className="w-full max-w-[480px] rounded-[10px] border border-[#d9d9d9] bg-white p-5 shadow-[0_0_48px_0_rgba(0,0,0,0.35)] sm:p-8 dark:border-none dark:bg-black dark:shadow-[0_0_48px_0_rgba(0,0,0,0.35)]">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-[17px] text-black dark:text-white"
            >
              Nama Lengkap
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              type="text"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              required
              className="h-9 w-full rounded-[10px] border border-[#d9d9d9] bg-white px-3 text-[17px] text-black outline-none placeholder:text-[15px] placeholder:font-medium placeholder:text-[rgba(0,0,0,0.16)] focus:border-[#001192] dark:border-[#d9d9d9] dark:focus:border-[#4258ff]"
            />
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
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Example@gmail.com"
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
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 Karakter"
              required
              minLength={8}
              className="h-9 w-full rounded-[10px] border border-[#d9d9d9] bg-white px-3 text-[15px] font-medium text-black outline-none placeholder:text-[15px] placeholder:font-medium placeholder:text-[rgba(0,0,0,0.16)] focus:border-[#001192] dark:border-[#d9d9d9] dark:focus:border-[#4258ff]"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-[17px] text-black dark:text-white"
            >
              Konfirmasi Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Minimal 8 Karakter"
              required
              minLength={8}
              className="h-9 w-full rounded-[10px] border border-[#d9d9d9] bg-white px-3 text-[15px] font-medium text-black outline-none placeholder:text-[15px] placeholder:font-medium placeholder:text-[rgba(0,0,0,0.16)] focus:border-[#001192] dark:border-[#d9d9d9] dark:focus:border-[#4258ff]"
            />
          </div>

          <button
            type="submit"
            className="mt-2 rounded-[10px] bg-[#001192] py-3 text-[17px] font-bold text-white transition-opacity hover:opacity-90 dark:bg-[#4258ff]"
          >
            Buat Akun
          </button>
        </form>
      </div>

      <p className="mt-5 text-center text-[17px] text-black dark:text-white">
        Sudah punya akun?{" "}
        <a
          href="/login"
          className="font-bold text-[#001192] dark:text-[#4258ff]"
        >
          Login
        </a>
      </p>
    </div>
  );
}
