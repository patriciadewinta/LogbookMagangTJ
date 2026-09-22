"use client";

import { useState } from "react";
import Link from "next/link";
import PageTransition from "@/components/page-transition";
import { requestPasswordReset } from "@/app/actions";

export default function LupaPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData();
    fd.set("email", email);
    const res = await requestPasswordReset(fd);
    setLoading(false);
    if (res?.error) {
      setError(res.error);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-[#edf7fe] px-4 py-12 dark:bg-[#262f49]">
      <PageTransition>
        <div className="relative w-full max-w-[520px] overflow-hidden rounded-[10px] border-4 border-transparent bg-[rgba(255,246,246,0.54)] shadow-[0_0_48px_0_rgba(0,0,0,0.35)] dark:border-[#0d196d] dark:bg-black dark:shadow-[0_0_48px_0_rgba(157,150,150,0.35)]">
          <div className="relative flex flex-col px-6 py-8 sm:px-10">
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

            {sent ? (
              <>
                <h1 className="text-[28px] font-bold leading-[1.1] text-black dark:text-white sm:text-[32px]">
                  Cek Email Kamu
                </h1>
                <p className="mt-2 text-[17px] font-light text-black dark:text-white">
                  Link untuk membuat password baru sudah dikirim ke{" "}
                  <span className="font-medium">{email}</span>. Buka link itu
                  untuk melanjutkan. Link berlaku selama 1 jam.
                </p>
                <Link
                  href="/login"
                  className="mt-8 rounded-[10px] bg-[#001192] py-3 text-center text-[17px] font-bold text-white transition-opacity hover:opacity-90 dark:bg-[#4258ff]"
                >
                  Ke Halaman Login
                </Link>
              </>
            ) : (
              <>
                <h1 className="text-[28px] font-bold leading-[1.1] text-black dark:text-white sm:text-[32px]">
                  Lupa Password
                </h1>
                <p className="mt-2 text-[17px] font-light text-black dark:text-white">
                  Masukkan email akun Anda. Kami akan mengirimkan link untuk
                  membuat password baru.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 flex flex-col">
                  {error && (
                    <p className="mb-4 rounded-[10px] border border-red-300 bg-red-50 px-3 py-2 text-[15px] text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                      {error}
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
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan email Anda"
                    autoComplete="email"
                    required
                    className="w-full border-b border-black/30 bg-transparent pb-2 text-[17px] text-black outline-none placeholder:font-normal placeholder:opacity-30 focus:border-[#001192] dark:border-white/30 dark:text-white dark:placeholder:text-white dark:focus:border-[#4258ff]"
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-8 rounded-[10px] bg-[#001192] py-3 text-[17px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-[#4258ff]"
                  >
                    {loading ? "Mengirim..." : "Kirim Link Reset"}
                  </button>

                  <p className="mt-4 text-center text-[15px] font-light text-black dark:text-white">
                    Link reset password akan dikirim ke email Anda.
                  </p>
                </form>

                <Link
                  href="/login"
                  className="mt-4 self-center text-[17px] font-medium text-[#001192] dark:text-[#4258ff]"
                >
                  Kembali ke halaman login
                </Link>
              </>
            )}
          </div>
        </div>
      </PageTransition>
    </div>
  );
}
