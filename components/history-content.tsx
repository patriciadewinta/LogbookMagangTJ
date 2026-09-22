"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DownloadButton from "@/components/download-button";
import { useToast } from "@/components/toast-provider";
import { usePopup } from "@/components/popup";
import { deleteSubmission, markPaid, updateSubmission } from "@/app/actions";

const inputClass =
  "h-9 w-full rounded-[10px] border border-[#d9d9d9] bg-white px-3 text-[15px] text-black outline-none focus:border-[#001192] dark:border-[#d9d9d9] dark:bg-black dark:text-white dark:focus:border-[#4258ff]";
const labelClass = "mb-1 block text-[15px] text-black dark:text-white";

type SubmissionRow = {
  id: string;
  userId: string;
  nama: string;
  tanggal: string;
  hariMasuk: string | number;
  hariCuti: string | number;
  keterangan: string;
  isPaid: boolean;
  nominal: number | null;
  logbookFilePath: string | null;
  signedFilePath: string | null;
  status: string;
  hadirCount: number | null;
  cutiCount: number | null;
  rejectionReason: string | null;
  pembimbingName: string | null;
  kadepName: string | null;
  kadivName: string | null;
};

const rupiah = new Intl.NumberFormat("id-ID");

export default function HistoryContent({
  submissions,
  salaryPerDay,
}: {
  submissions: SubmissionRow[];
  salaryPerDay: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const { confirm } = usePopup();
  const [selectedCount, setSelectedCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [payOpen, setPayOpen] = useState(false);
  const [payBusy, setPayBusy] = useState(false);
  const [editRow, setEditRow] = useState<SubmissionRow | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState<string | null>(null);

  function openPayModal() {
    setPayOpen(true);
  }

  function closePayModal() {
    if (payBusy) return;
    setPayOpen(false);
  }

  async function handlePaySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (payBusy) return;
    const fd = new FormData(e.currentTarget);
    fd.set("ids", [...selectedIds].join(","));
    setPayBusy(true);
    const res = await markPaid(fd);
    setPayBusy(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(`${selectedCount} laporan ditandai sudah dibayar.`);
      setPayOpen(false);
      setSelectedIds(new Set());
      setSelectedCount(0);
      router.refresh();
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    setSelectedCount(newSelected.size);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === submissions.length) {
      setSelectedIds(new Set());
      setSelectedCount(0);
    } else {
      setSelectedIds(new Set(submissions.map((s) => s.id)));
      setSelectedCount(submissions.length);
    }
  };

  function openEdit(r: SubmissionRow) {
    setEditRow(r);
  }

  function closeEditModal() {
    if (editBusy) return;
    setEditRow(null);
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (editBusy) return;
    const fd = new FormData(e.currentTarget);
    if (editRow) fd.set("id", editRow.id);
    setEditBusy(true);
    const res = await updateSubmission(fd);
    setEditBusy(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Data kehadiran diperbarui.");
      setEditRow(null);
      router.refresh();
    }
  }

  async function handleDelete(r: SubmissionRow) {
    if (deleteBusy) return;
    const ok = await confirm({
      title: "Hapus Laporan",
      message: `Hapus laporan logbook milik "${r.nama}"? File logbook (dan e-sign jika ada) juga akan dihapus.`,
      confirmLabel: "Hapus",
      danger: true,
    });
    if (!ok) return;
    setDeleteBusy(r.id);
    const fd = new FormData();
    fd.set("id", r.id);
    const res = await deleteSubmission(fd);
    setDeleteBusy(null);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Laporan dihapus.");
      router.refresh();
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-[#333333] dark:text-white sm:text-3xl">
        Rekap Aktivitas Anak Magang
      </h1>

      {/* Filter Bar */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#6b7280] dark:text-white/75">
            {selectedCount} Dipilih
          </span>
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={openPayModal}
              className="rounded-full bg-[#4258FF] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#374adf]"
            >
              Tandai Sudah Dibayar
            </button>
          )}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Search"
            className="h-9 w-full rounded-[10px] border border-[#d9d9d9] bg-white pl-10 pr-4 text-sm text-[#333333] outline-none focus:border-[#4258FF] dark:border-[#d9d9d9] dark:bg-black dark:text-white dark:focus:border-[#4258ff]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-[10px] border border-[#d9d9d9] bg-white dark:border-white/10 dark:bg-black">
        {submissions.length > 0 ? (
          <table className="w-full min-w-[1020px] border-collapse text-left">
            <thead>
              <tr className="bg-[#374ADF]/[0.07] dark:bg-[#374ADF]/[0.07]">
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === submissions.length && submissions.length > 0}
                    onChange={toggleSelectAll}
                    className="size-4 cursor-pointer rounded border-[#d9d9d9] text-[#4258FF] focus:ring-0 dark:border-white/20 dark:text-[#4258ff]"
                  />
                </th>
                {["Nama", "Tanggal", "Total Hari Masuk", "Total Hari Cuti/Izin", "Status Approval", "Status Bayar", "Nominal Uang Saku", "Action"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-xs font-semibold text-[#333333] dark:text-white/80"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {submissions.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-[#f0f0f0] dark:border-white/10"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(r.id)}
                      onChange={() => toggleSelect(r.id)}
                      className="size-4 cursor-pointer rounded border-[#d9d9d9] text-[#4258FF] focus:ring-0 dark:border-white/20 dark:text-[#4258ff]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[#deedf8] text-xs font-bold text-[#1e3a8a] dark:bg-white/10 dark:text-[#4258ff]">
                        {r.nama.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate text-sm font-medium text-[#1f2937] dark:text-white">
                        {r.nama}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6b7280] dark:text-white/70">
                    {r.tanggal}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#1f2937] dark:text-white">
                    {typeof r.hariMasuk === "number" ? r.hariMasuk : r.hariMasuk}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#1f2937] dark:text-white">
                    {typeof r.hariCuti === "number" ? r.hariCuti : r.hariCuti}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6b7280] dark:text-white/70">
                    {r.keterangan}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-lg px-3 py-1 text-xs font-semibold ${
                        r.isPaid
                          ? "bg-[#00D800] text-white"
                          : "bg-[#e5e7eb] text-[#6b7280] dark:bg-white/10 dark:text-white/75"
                      }`}
                    >
                      {r.isPaid ? "Sudah Dibayar" : "Belum Dibayar"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-[#1f2937] dark:text-white">
                    {r.hadirCount != null ? `Rp ${rupiah.format(r.hadirCount * salaryPerDay)}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {(r.signedFilePath || r.logbookFilePath) && (
                        <DownloadButton
                          path={r.signedFilePath ?? r.logbookFilePath ?? ""}
                          bucket="logbooks"
                          label={r.signedFilePath ? "E-sign" : "Logbook"}
                          submissionId={
                            r.status === "kadiv_approved" && !r.signedFilePath ? r.id : undefined
                          }
                        />
                      )}
                      <button className="flex items-center gap-1.5 rounded-[10px] bg-[#00D4D8] px-4 py-1.5 text-[14px] font-bold text-white transition-opacity hover:opacity-90">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        KTM
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(r)}
                        title="Edit"
                        aria-label={`Edit ${r.nama}`}
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
                        onClick={() => handleDelete(r)}
                        disabled={deleteBusy === r.id}
                        title="Hapus"
                        aria-label={`Hapus ${r.nama}`}
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
          <p className="px-6 py-10 text-center text-sm text-[#6b7280] dark:text-white/65">
            Belum ada laporan dari anak magang.
          </p>
        )}
      </div>

      {payOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={closePayModal}
        >
          <div
            className="w-full max-w-sm rounded-[10px] bg-white p-5 shadow-[0_0_48px_0_rgba(0,0,0,0.35)] dark:bg-black sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[20px] font-bold text-black dark:text-white">
                Tandai Sudah Dibayar
              </h2>
              <button
                type="button"
                onClick={closePayModal}
                aria-label="Tutup"
                className="grid size-8 cursor-pointer place-items-center rounded-full text-black/60 transition-colors hover:bg-black/5 dark:text-white/75 dark:hover:bg-white/10"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="flex flex-col gap-4">
              <p className="text-[14px] text-[#6b7280] dark:text-white/70">
                {selectedCount} laporan akan ditandai sudah dibayar. Nominal dihitung otomatis:
                total hari masuk × Rp {rupiah.format(salaryPerDay)}.
              </p>
              <button
                type="submit"
                disabled={payBusy}
                className="w-full rounded-[10px] bg-[#5E46FF] py-3 text-[16px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {payBusy ? "Menyimpan..." : "Simpan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {editRow && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={closeEditModal}
        >
          <div
            className="w-full max-w-sm rounded-[10px] border border-[#d9d9d9] bg-white p-5 shadow-[0_0_48px_0_rgba(0,0,0,0.35)] dark:border-white/10 dark:bg-black sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[20px] font-bold text-black dark:text-white">
                Edit Data Kehadiran
              </h2>
              <button
                type="button"
                onClick={closeEditModal}
                aria-label="Tutup"
                className="grid size-8 cursor-pointer place-items-center rounded-full text-black/60 transition-colors hover:bg-black/5 dark:text-white/75 dark:hover:bg-white/10"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="e-hadir" className={labelClass}>
                  Total Hari Masuk
                </label>
                <input
                  id="e-hadir"
                  name="hadir_count"
                  type="number"
                  min={0}
                  required
                  defaultValue={editRow.hadirCount ?? 0}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="e-cuti" className={labelClass}>
                  Total Hari Cuti/Izin
                </label>
                <input
                  id="e-cuti"
                  name="cuti_count"
                  type="number"
                  min={0}
                  required
                  defaultValue={editRow.cutiCount ?? 0}
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={editBusy}
                className="mt-2 w-full rounded-[10px] bg-[#5E46FF] py-3 text-[16px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {editBusy ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
