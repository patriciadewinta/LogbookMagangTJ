"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signIn } from "@/app/actions";
import PageTransition from "@/components/page-transition";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, { error: null });
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-[#edf7fe] px-4 py-12 dark:bg-[#262f49]">
      <PageTransition>
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

            <form action={formAction} className="mt-8 flex flex-col">
              {state?.error && (
                <p className="mb-4 rounded-[10px] border border-red-300 bg-red-50 px-3 py-2 text-[15px] text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                  {state.error}
                </p>
              )}
              <label
                htmlFor="email"
                className="text-[17px] font-medium text-black dark:text-white"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="account@gmail.com"
                autoComplete="email"
                required
                className="border-b border-black/30 bg-transparent pb-2 text-[17px] text-black outline-none placeholder:font-normal placeholder:opacity-30 focus:border-[#001192] dark:border-white/30 dark:text-white dark:placeholder:text-white dark:focus:border-[#4258ff]"
              />

              <label
                htmlFor="password"
                className="mt-6 text-[17px] font-medium text-black dark:text-white"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="your password"
                  autoComplete="current-password"
                  required
                  className="w-full border-b border-black/30 bg-transparent pb-2 pr-8 text-[17px] text-black outline-none placeholder:font-normal placeholder:opacity-30 focus:border-[#001192] dark:border-white/30 dark:text-white dark:placeholder:text-white dark:focus:border-[#4258ff]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute bottom-1 right-0 grid size-7 cursor-pointer place-items-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <img
                    src={showPassword ? "/assets/eye.svg" : "/assets/eye-closed.svg"}
                    alt=""
                    className="size-5 object-contain"
                  />
                </button>
              </div>

              <a
                href="#"
                className="mt-3 self-end text-[17px] font-medium text-[#001192] dark:text-[#4258ff]"
              >
                Lupa Password?
              </a>

              <button
                type="submit"
                disabled={pending}
                className="mt-6 rounded-[10px] bg-[#001192] py-3 text-[17px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-[#4258ff]"
              >
                {pending ? "Masuk..." : "Login"}
              </button>

              <p className="mt-5 text-center text-[17px] font-light text-black dark:text-white">
                Belum punya akun?{" "}
                <Link
                  href="/register"
                  transitionTypes={["nav-forward"]}
                  className="font-medium text-[#001192] dark:text-[#4258ff]"
                >
                  Daftar
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
      </PageTransition>
    </div>
  );
}
