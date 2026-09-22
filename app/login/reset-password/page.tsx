"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PageTransition from "@/components/page-transition";
import PasswordInput from "@/components/password-input";
import { usePopup } from "@/components/popup";

function ResetPasswordContent() {
  const router = useRouter();
  const { alert } = usePopup();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tokenValid, setTokenValid] = useState(true);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setChecking(false);
      setError("Link tidak valid. Token tidak ditemukan.");
      return;
    }

    async function checkToken() {
      try {
        const res = await fetch(`/api/auth/reset-password?token=${token}`);
        const data = await res.json();

        if (data.success) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setError(data.error || "Token tidak valid");
        }
      } catch {
        setTokenValid(false);
        setError("Gagal memverifikasi token");
      } finally {
        setChecking(false);
      }
    }

    checkToken();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!tokenValid) {
      setError("Link tidak valid.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak sama.");
      return;
    }

    if (password.length < 6) {
      setError("Password harus minimal 6 karakter.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (data.success) {
        await alert({
          title: "Berhasil",
          message: "Password berhasil diubah! Silakan login.",
        });
        router.push("/login");
      } else {
        setError(data.error || "Gagal reset password");
      }
    } catch (err) {
      setError("Error: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
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

            {checking ? (
              <div className="flex flex-1 items-center justify-center py-10">
                <p className="text-[17px] font-light text-black dark:text-white">
                  Memeriksa token...
                </p>
              </div>
            ) : tokenValid ? (
              <>
                <h1 className="text-[28px] font-bold leading-[1.1] text-black dark:text-white sm:text-[32px]">
                  Buat Password Baru
                </h1>
                <p className="mt-2 text-[17px] font-light text-black dark:text-white">
                  Masukkan password baru untuk akun Anda.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 flex flex-col">
                  {error && (
                    <p className="mb-4 rounded-[10px] border border-red-300 bg-red-50 px-3 py-2 text-[15px] text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                      {error}
                    </p>
                  )}

                  <PasswordInput
                    id="password"
                    label="Password Baru"
                    value={password}
                    onChange={setPassword}
                    placeholder="Minimal 6 karakter"
                    autoComplete="new-password"
                    required
                    minLength={6}
                  />

                  <PasswordInput
                    id="confirmPassword"
                    label="Konfirmasi Password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Ketik ulang password"
                    autoComplete="new-password"
                    required
                    labelClassName="mt-6"
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-8 rounded-[10px] bg-[#001192] py-3 text-[17px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-[#4258ff]"
                  >
                    {loading ? "Memproses..." : "Simpan Password Baru"}
                  </button>

                  <p className="mt-4 text-center text-[15px] font-light text-black dark:text-white">
                    Password minimal 6 karakter.
                  </p>
                </form>

                <Link
                  href="/login"
                  className="mt-4 self-center text-[17px] font-medium text-[#001192] dark:text-[#4258ff]"
                >
                  Kembali ke halaman login
                </Link>
              </>
            ) : (
              <div className="flex flex-1 flex-col justify-center py-6 text-center">
                <h1 className="text-[28px] font-bold leading-[1.1] text-black dark:text-white sm:text-[32px]">
                  Link Tidak Valid
                </h1>
                <p className="mt-3 text-[17px] font-light text-black dark:text-white">
                  {error || "Link reset password tidak valid atau telah kadaluarsa."}
                </p>
                <Link
                  href="/login"
                  className="mx-auto mt-8 rounded-[10px] bg-[#001192] px-10 py-3 text-[17px] font-bold text-white transition-opacity hover:opacity-90 dark:bg-[#4258ff]"
                >
                  Ke Halaman Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </PageTransition>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
