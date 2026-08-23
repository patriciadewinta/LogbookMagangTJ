"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteIntern, updateIntern } from "@/app/actions";
import { PROVINCES } from "@/lib/domisili";

export type InternRow = {
  id: string;
  fullName: string;
  email: string | null;
  university: string | null;
  domisili: string | null;
  posisi: string | null;
  startDate: string | null;
  endDate: string | null;
  phone: string | null;
};

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function formatDate(v: string | null) {
  if (!v) return "—";
  const [y, m, d] = v.split("-");
  if (!y || !m || !d) return v;
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
}

const inputClass =
  "h-9 w-full rounded-[10px] border border-[#d9d9d9] bg-white px-3 text-[15px] text-black outline-none focus:border-[#001192] dark:border-[#d9d9d9] dark:bg-black dark:text-white dark:focus:border-[#4258ff]";
const labelClass = "mb-1 block text-[15px] text-black dark:text-white";

export default function OdInternTable({ interns }: { interns: InternRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<InternRow | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function openEdit(intern: InternRow) {
    setFormError(null);
    setEditing(intern);
  }

  function closeModal() {
    if (busy) return;
    setEditing(null);
    setFormError(null);
  }

  async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const fd = new FormData(e.currentTarget);
    if (editing) fd.set("id", editing.id);
    setBusy(true);
    setFormError(null);
    const res = await updateIntern({ error: null }, fd);
    setBusy(false);
    if (res?.error) {
      setFormError(res.error);
    } else {
      setEditing(null);
      router.refresh();
    }
  }

  async function handleDelete(intern: InternRow) {
    if (deleteBusy) return;
    const ok = window.confirm(`Hapus akun & data anak magang "${intern.fullName}"?`);
    if (!ok) return;
    setDeleteBusy(intern.id);
    setDeleteError(null);
    const fd = new FormData();
    fd.set("id", intern.id);
    const res = await deleteIntern(fd);
    setDeleteBusy(null);
    if (res?.error) {
      setDeleteError(res.error);
    } else {
      router.refresh();
    }
  }

  return (
    <>
      {deleteError && (
        <p className="mt-8 text-[15px] text-red-600 dark:text-red-400">{deleteError}</p>
      )}

      <div className="mt-6 overflow-x-auto rounded-[10px] border border-[#d9d9d9] bg-white dark:border-white/10 dark:bg-black">
        {interns.length > 0 ? (
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="bg-[#374ADF]/[0.07] dark:bg-[#374ADF]/[0.07]">
                {[
                  "Nama",
                  "Asal Domisili",
                  "Universitas/Instansi",
                  "Posisi",
                  "Tanggal Mulai Magang",
                  "Tanggal Selesai Magang",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-[14px] font-semibold text-[#333333] dark:text-white/80"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {interns.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-[#f0f0f0] dark:border-white/10"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#deedf8] text-[14px] font-bold text-[#001192] dark:bg-white/10 dark:text-[#4258ff]">
                        {p.fullName.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate text-[15px] font-medium text-black dark:text-white">
                        {p.fullName || "Mahasiswa"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[15px] text-black/70 dark:text-white/70">
                    {p.domisili || "—"}
                  </td>
                  <td className="px-4 py-3 text-[15px] text-black/70 dark:text-white/70">
                    {p.university || "—"}
                  </td>
                  <td className="px-4 py-3 text-[15px] text-black/70 dark:text-white/70">
                    {p.posisi || "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[15px] text-black dark:text-white">
                    {formatDate(p.startDate)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[15px] text-black dark:text-white">
                    {formatDate(p.endDate)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        title="Edit"
                        aria-label={`Edit ${p.fullName}`}
                        className="grid size-8 cursor-pointer place-items-center rounded-[8px] text-[#001192] transition-colors hover:bg-[#deedf8] dark:text-[#4258ff] dark:hover:bg-white/10"
                      >
                        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
                          <path
                            d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        disabled={deleteBusy === p.id}
                        title="Hapus"
                        aria-label={`Hapus ${p.fullName}`}
                        className="grid size-8 cursor-pointer place-items-center rounded-[8px] text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-white/10"
                      >
                        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-6 py-10 text-center text-[16px] text-black/40 dark:text-white/40">
            Belum ada anak magang.
          </p>
        )}
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={closeModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[10px] bg-white p-5 shadow-[0_0_48px_0_rgba(0,0,0,0.35)] dark:bg-black sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[20px] font-bold text-black dark:text-white">
                Edit Anak Magang
              </h2>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Tutup"
                className="grid size-8 cursor-pointer place-items-center rounded-full text-black/60 transition-colors hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/10"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {formError && (
              <p className="mb-4 rounded-[10px] border border-red-300 bg-red-50 px-3 py-2 text-[15px] text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {formError}
              </p>
            )}

            <form
              key={editing.id}
              onSubmit={handleFormSubmit}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="f-name" className={labelClass}>
                    Nama Lengkap
                  </label>
                  <input
                    id="f-name"
                    name="full_name"
                    type="text"
                    defaultValue={editing.fullName}
                    required
                    placeholder="Nama lengkap anak magang"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="f-domisili" className={labelClass}>
                    Asal Daerah
                  </label>
                  <select
                    id="f-domisili"
                    name="domisili"
                    defaultValue={editing.domisili ?? ""}
                    required
                    className={inputClass}
                  >
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
                  <label htmlFor="f-university" className={labelClass}>
                    Universitas/Instansi
                  </label>
                  <input
                    id="f-university"
                    name="university"
                    type="text"
                    defaultValue={editing.university ?? ""}
                    placeholder="Contoh: Universitas Indonesia"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="f-email" className={labelClass}>
                    Email
                  </label>
                  <input
                    id="f-email"
                    name="email"
                    type="email"
                    defaultValue={editing.email ?? ""}
                    readOnly
                    className={`${inputClass} cursor-not-allowed bg-[#f3f4f6] dark:bg-white/10`}
                  />
                </div>

                <div>
                  <label htmlFor="f-phone" className={labelClass}>
                    Nomor Telepon
                  </label>
                  <input
                    id="f-phone"
                    name="phone"
                    type="tel"
                    defaultValue={editing.phone ?? ""}
                    placeholder="Contoh: 0812-3456-7890"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="f-posisi" className={labelClass}>
                    Posisi
                  </label>
                  <input
                    id="f-posisi"
                    name="posisi"
                    type="text"
                    defaultValue={editing.posisi ?? ""}
                    placeholder="Contoh: Data Analyst"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="f-start" className={labelClass}>
                    Tanggal Mulai Magang
                  </label>
                  <input
                    id="f-start"
                    name="start_date"
                    type="date"
                    defaultValue={editing.startDate ?? ""}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="f-end" className={labelClass}>
                    Tanggal Selesai Magang
                  </label>
                  <input
                    id="f-end"
                    name="end_date"
                    type="date"
                    defaultValue={editing.endDate ?? ""}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="mt-2 w-full rounded-[10px] bg-[#5E46FF] py-3 text-[16px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {busy ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
