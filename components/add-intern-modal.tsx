"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PROVINCES } from "@/lib/domisili";
import { useToast } from "@/components/toast-provider";

const inputClass =
  "h-9 w-full rounded-[10px] border border-[#d9d9d9] bg-white px-3 text-[15px] text-black outline-none focus:border-[#001192] dark:border-[#d9d9d9] dark:bg-black dark:text-white dark:focus:border-[#4258ff]";
const labelClass = "mb-1 block text-[15px] text-black dark:text-white";

export default function AddInternModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [lastEmail, setLastEmail] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      email: String(fd.get("email") ?? "").trim(),
      name: String(fd.get("name") ?? "").trim(),
      university: String(fd.get("university") ?? "").trim() || null,
      posisi: String(fd.get("posisi") ?? "").trim() || null,
      domisili: String(fd.get("domisili") ?? "").trim() || null,
      startDate: String(fd.get("start_date") ?? "").trim() || null,
      endDate: String(fd.get("end_date") ?? "").trim() || null,
      phone: String(fd.get("phone") ?? "").trim() || null,
    };

    setLoading(true);
    try {
      const response = await fetch("/api/od/add-intern", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        toast.error(data.error || "Gagal menambahkan anak magang");
      } else {
        toast.success(`Email setup password dikirim ke ${payload.email}.`);
        setLastEmail(payload.email);
        form.reset();
        router.refresh();
      }
    } catch (err) {
      toast.error(
        "Terjadi kesalahan: " + (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[10px] border border-[#d9d9d9] bg-white p-5 shadow-[0_0_48px_0_rgba(0,0,0,0.35)] dark:border-white/10 dark:bg-black sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[20px] font-bold text-black dark:text-white">
            Tambah Anak Magang
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="grid size-8 cursor-pointer place-items-center rounded-full text-black/60 transition-colors hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/10"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="a-name" className={labelClass}>
                Nama Lengkap
              </label>
              <input
                id="a-name"
                name="name"
                type="text"
                required
                placeholder="Contoh: Budi Santoso"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="a-domisili" className={labelClass}>
                Asal Daerah
              </label>
              <select id="a-domisili" name="domisili" required defaultValue="" className={inputClass}>
                <option value="" disabled>
                  Pilih Provinsi
                </option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="a-university" className={labelClass}>
                Universitas/Instansi
              </label>
              <input
                id="a-university"
                name="university"
                type="text"
                placeholder="Contoh: Universitas Indonesia"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="a-email" className={labelClass}>
                Email
              </label>
              <input
                id="a-email"
                name="email"
                type="email"
                required
                placeholder="contoh@email.com"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="a-phone" className={labelClass}>
                Nomor Telepon
              </label>
              <input
                id="a-phone"
                name="phone"
                type="tel"
                placeholder="Contoh: 0812-3456-7890"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="a-posisi" className={labelClass}>
                Posisi
              </label>
              <input
                id="a-posisi"
                name="posisi"
                type="text"
                placeholder="Contoh: Data Analyst"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="a-start" className={labelClass}>
                Tanggal Mulai Magang
              </label>
              <input id="a-start" name="start_date" type="date" className={inputClass} />
            </div>
            <div>
              <label htmlFor="a-end" className={labelClass}>
                Tanggal Selesai Magang
              </label>
              <input id="a-end" name="end_date" type="date" className={inputClass} />
            </div>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-[10px] bg-[#5E46FF] py-3 text-[16px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Mengirim..." : "Simpan & Kirim Email"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
