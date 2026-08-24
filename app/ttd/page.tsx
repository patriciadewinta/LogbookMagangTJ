"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PageTransition from "@/components/page-transition";
import { usePopup } from "@/components/popup";

type TokenData = {
  tahap: string;
  tahapLabel: string;
  approverName: string;
  namaPengaju: string;
  universitas: string;
  posisi: string;
  domisili: string;
  namaFile: string;
  periode: string;
  pdfUrl: string;
};

type SuccessData = {
  tahapLabel: string;
  finished: boolean;
  nextTahapLabel: string | null;
  nextApproverName: string | null;
};

function TtdContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { alert, confirm } = usePopup();

  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<TokenData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessData | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Link tidak valid. Token tidak ditemukan.");
      setChecking(false);
      return;
    }

    async function checkToken() {
      try {
        const res = await fetch(`/api/approval?token=${token}`);
        const json = await res.json();
        if (json.success) {
          setData(json);
        } else {
          setError(json.error || "Link tidak valid.");
        }
      } catch {
        setError("Gagal memuat data. Coba muat ulang halaman.");
      } finally {
        setChecking(false);
      }
    }

    checkToken();
  }, [token]);

  async function handleTtd() {
    if (!token) return;
    const ok = await confirm({
      title: "Tanda Tangan Logbook",
      message: `Setujui dan tandatangani logbook ini pada tahap ${data?.tahapLabel ?? ""}?`,
    });
    if (!ok) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess({
          tahapLabel: json.tahapLabel,
          finished: json.finished,
          nextTahapLabel: json.nextTahapLabel,
          nextApproverName: json.nextApproverName,
        });
      } else {
        await alert({ title: "Gagal", message: json.error || "Gagal memproses." });
        setError(json.error || "Gagal memproses.");
        setData(null);
      }
    } catch {
      await alert({ title: "Gagal", message: "Terjadi kesalahan jaringan." });
    } finally {
      setSubmitting(false);
    }
  }

  const detailRows: Array<[string, string]> = data
    ? [
        ["Nama", data.namaPengaju],
        ["Universitas", data.universitas],
        ["Posisi", data.posisi],
        ["Domisili", data.domisili],
        ["Periode", data.periode],
        ["File", data.namaFile],
      ].filter((row): row is [string, string] => row[1] !== "")
    : [];

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-[#edf7fe] px-4 py-12 dark:bg-[#262f49]">
      <PageTransition>
        <div className="w-full max-w-[720px] overflow-hidden rounded-[10px] border-4 border-transparent bg-[rgba(255,246,246,0.54)] shadow-[0_0_48px_0_rgba(0,0,0,0.35)] dark:border-[#0d196d] dark:bg-black dark:shadow-[0_0_48px_0_rgba(157,150,150,0.35)]">
          <div className="flex flex-col px-6 py-8 sm:px-10">
            {checking ? (
              <p className="py-20 text-center text-[17px] font-light text-black dark:text-white">
                Memeriksa tautan...
              </p>
            ) : success ? (
              <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                <img
                  src="/assets/check-mark.png"
                  alt=""
                  className="mb-4 size-16 object-contain"
                />
                <h1 className="text-[26px] font-bold leading-tight text-black dark:text-white sm:text-[32px]">
                  Tanda Tangan Berhasil
                </h1>
                <p className="mt-3 text-[17px] font-light text-black dark:text-white">
                  {success.finished
                    ? `Logbook telah ditandatangani semua tahap. Terima kasih!`
                    : `Tahap ${success.tahapLabel} selesai. Logbook selanjutnya menunggu tanda tangan ${
                        success.nextApproverName
                          ? `${success.nextApproverName} (${success.nextTahapLabel})`
                          : success.nextTahapLabel
                      }.`}
                </p>
              </div>
            ) : error && !data ? (
              <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                <h1 className="text-[26px] font-bold leading-tight text-black dark:text-white sm:text-[32px]">
                  Tautan Tidak Dapat Digunakan
                </h1>
                <p className="mt-3 text-[17px] font-light text-black dark:text-white">
                  {error}
                </p>
              </div>
            ) : data ? (
              <>
                <h1 className="text-[26px] font-bold leading-tight text-black dark:text-white sm:text-[32px]">
                  Tanda Tangan Logbook
                </h1>
                <p className="mt-1 text-[15px] font-light text-black dark:text-white">
                  Tahap {data.tahapLabel} — Yth. {data.approverName}
                </p>

                <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-[15px]">
                  {detailRows.map(([label, value]) => (
                    <div key={label} className="col-span-2 grid grid-cols-[110px_1fr]">
                      <dt className="text-black/50 dark:text-white/50">{label}</dt>
                      <dd className="font-medium text-black dark:text-white">{value}</dd>
                    </div>
                  ))}
                </dl>

                <iframe
                  src={data.pdfUrl}
                  title="Logbook"
                  className="mt-5 h-[70vh] w-full rounded-[10px] border border-black/10 bg-white dark:border-white/20"
                />

                <div className="mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleTtd}
                    disabled={submitting}
                    className="rounded-[10px] bg-[#001192] px-10 py-3 text-[17px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-[#4258ff]"
                  >
                    {submitting ? "Memproses..." : "TTD"}
                  </button>
                  <a
                    href={data.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[15px] font-medium text-[#001192] dark:text-[#4258ff]"
                  >
                    Buka di tab baru
                  </a>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </PageTransition>
    </div>
  );
}

export default function TtdPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TtdContent />
    </Suspense>
  );
}
