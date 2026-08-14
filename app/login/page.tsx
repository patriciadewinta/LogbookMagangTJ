"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire ke auth API
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-[#edf7fe] px-4 py-12 dark:bg-[#262f49]">
      <div className="relative w-full max-w-[860px] overflow-hidden rounded-[10px] border-4 border-transparent bg-[rgba(255,246,246,0.54)] shadow-[0_0_48px_0_rgba(0,0,0,0.35)] dark:border-[#0d196d] dark:bg-black dark:shadow-[0_0_48px_0_rgba(157,150,150,0.35)]">
        <div className="flex min-h-[460px]">
          <div className="relative hidden w-[360px] shrink-0 md:block">
            <img
              src="/assets/login-hero.png"
              alt="Ilustrasi logbook magang"
              className="absolute inset-0 size-full rounded-[10px] object-cover backdrop-blur-[2px]"
            />
          </div>

          <div className="relative flex flex-1 flex-col px-6 py-8 sm:px-14">
            <img
              src="/assets/logo-tj.png"
              alt="Logo Tj"
              className="mb-4 h-[50px] w-[50px] rounded-[10px] object-cover dark:hidden"
            />
            <img
              src="/assets/logo-tj-dark.png"
              alt="Logo Tj"
              className="mb-4 hidden h-[50px] w-[50px] rounded-[10px] object-cover dark:block"
            />

            <h1 className="text-[28px] font-bold leading-[1.1] text-black dark:text-white sm:text-[40px]">
              Selamat Datang!
            </h1>
            <p className="mt-2 text-[17px] font-light text-black dark:text-white">
              Silahkan login untuk melakukan report logbook magang
            </p>

            <form onSubmit={onSubmit} className="mt-8 flex flex-col">
              <label
                htmlFor="email"
                className="text-[17px] font-medium text-black dark:text-white"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="account@gmail.com"
                required
                className="border-b border-black/30 bg-transparent pb-2 text-[17px] text-black outline-none placeholder:font-normal placeholder:opacity-30 focus:border-[#001192] dark:border-white/30 dark:text-white dark:placeholder:text-white dark:focus:border-[#4258ff]"
              />

              <label
                htmlFor="password"
                className="mt-6 text-[17px] font-medium text-black dark:text-white"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="your password"
                required
                className="border-b border-black/30 bg-transparent pb-2 text-[17px] text-black outline-none placeholder:font-normal placeholder:opacity-30 focus:border-[#001192] dark:border-white/30 dark:text-white dark:placeholder:text-white dark:focus:border-[#4258ff]"
              />

              <a
                href="#"
                className="mt-3 self-end text-[17px] font-medium text-[#001192] dark:text-[#4258ff]"
              >
                Lupa Password?
              </a>

              <button
                type="submit"
                className="mt-6 rounded-[10px] bg-[#001192] py-3 text-[17px] font-bold text-white transition-opacity hover:opacity-90 dark:bg-[#4258ff]"
              >
                Login
              </button>

              <p className="mt-5 text-center text-[17px] font-light text-black dark:text-white">
                Belum punya akun?{" "}
                <a
                  href="/register"
                  className="font-medium text-[#001192] dark:text-[#4258ff]"
                >
                  Daftar
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
