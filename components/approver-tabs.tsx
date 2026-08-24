"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteApprover, saveApprover } from "@/app/actions";
import { usePopup } from "@/components/popup";
import { useToast } from "@/components/toast-provider";

export type ApproverRow = {
  id: string;
  name: string;
  email: string;
  divisi: string | null;
  role: string;
};

const ROLES = [
  { key: "pembimbing", label: "Pembimbing", long: "Pembimbing" },
  { key: "kadep", label: "Kepala Departemen", long: "Kepala Departemen" },
  { key: "kadiv", label: "Kepala Divisi", long: "Kepala Divisi" },
] as const;

type RoleKey = (typeof ROLES)[number]["key"];

const inputClass =
  "h-9 w-full rounded-[10px] border border-[#d9d9d9] bg-white px-3 text-[15px] text-black outline-none focus:border-[#001192] dark:border-[#d9d9d9] dark:bg-black dark:text-white dark:focus:border-[#4258ff]";
const labelClass = "mb-1 block text-[15px] text-black dark:text-white";

type ModalState =
  | { mode: "add"; role: RoleKey }
  | { mode: "edit"; approver: ApproverRow }
  | null;

export default function ApproverTabs({ approvers }: { approvers: ApproverRow[] }) {
  const router = useRouter();
  const { confirm } = usePopup();
  const toast = useToast();
  const [role, setRole] = useState<RoleKey>("pembimbing");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [busy, setBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return approvers.filter(
      (a) =>
        a.role === role &&
        (!q ||
          a.name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          (a.divisi ?? "").toLowerCase().includes(q))
    );
  }, [approvers, role, query]);

  const activeRole = ROLES.find((r) => r.key === role)!;

  function openAdd() {
    setModal({ mode: "add", role });
  }

  function openEdit(approver: ApproverRow) {
    setModal({ mode: "edit", approver });
  }

  function closeModal() {
    if (busy) return;
    setModal(null);
  }

  async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const fd = new FormData(e.currentTarget);
    if (modal?.mode === "edit") fd.set("id", modal.approver.id);
    setBusy(true);
    const res = await saveApprover({ error: null }, fd);
    setBusy(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(
        modal?.mode === "edit" ? "Perubahan data approver tersimpan." : "Approver baru ditambahkan."
      );
      setModal(null);
      router.refresh();
    }
  }

  async function handleDelete(approver: ApproverRow) {
    if (deleteBusy) return;
    const ok = await confirm({
      title: `Hapus ${activeRole.long}`,
      message: `Hapus ${activeRole.long.toLowerCase()} "${approver.name}"? Laporan lama tidak berubah (nama & email sudah tersimpan di tiap laporan).`,
      confirmLabel: "Hapus",
      danger: true,
    });
    if (!ok) return;
    setDeleteBusy(approver.id);
    const fd = new FormData();
    fd.set("id", approver.id);
    const res = await deleteApprover(fd);
    setDeleteBusy(null);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(`${approver.name} dihapus.`);
      router.refresh();
    }
  }

  const folderTab = (r: (typeof ROLES)[number]) =>
    `flex h-9 shrink-0 items-center rounded-t-[10px] border border-b-0 px-4 text-[12px] transition-colors sm:h-10 sm:px-[26px] sm:text-[13px] ${
      role === r.key
        ? "border-[#e6ebf1] bg-white font-bold text-[#15588e] shadow-[0_-3px_10px_rgba(22,73,116,0.04)] dark:border-white/10 dark:bg-[#2a3350] dark:text-[#8fb8ff]"
        : "border-[#e6ebf1] bg-[#eef1f5] font-semibold text-[#8a93a0] hover:text-[#15588e] dark:border-white/10 dark:bg-[#1f2840] dark:text-white/50 dark:hover:text-[#8fb8ff]"
    }`;

  const thCls = "h-[46px] px-[25px] text-left text-[13px] font-[650] text-[#657080]";
  const tdCls = "h-[42px] px-[25px] text-[12px] text-[#4e5968] whitespace-nowrap";
  const rowCls = "border-b border-[#edf0f3] last:border-b-0 hover:bg-[#fbfdff]";

  return (
    <div className="relative mt-8">
      {/* Folder header: tab role (kiri) + search & tombol tambah (kanan) */}
      <div className="-mb-px flex items-end justify-between gap-3">
        <div className="flex min-w-0 items-end gap-1.5 overflow-x-auto pl-[18px]">
          {ROLES.map((r) => (
            <button key={r.key} type="button" onClick={() => setRole(r.key)} className={folderTab(r)}>
              {r.label}
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2.5 pr-2 sm:pr-1">
          <label className="flex h-9 w-28 items-center gap-2.5 rounded-[7px] border border-[#e6ebf1] bg-[#eef1f5] px-[13px] text-[#9ba8b8] sm:h-10 sm:w-[200px] dark:border-white/10 dark:bg-[#1f2840]">
            <svg
              viewBox="0 0 24 24"
              className="size-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-full bg-transparent text-[13px] text-[#39485b] outline-none placeholder:text-[#aeb8c4] dark:text-white dark:placeholder:text-white/40"
            />
          </label>

          <button
            type="button"
            onClick={openAdd}
            title={`Tambah ${activeRole.long}`}
            className="flex h-9 min-h-9 items-center gap-2 rounded-[7px] bg-[#5E46FF] px-3 text-[12px] font-bold text-white transition-opacity hover:opacity-90 sm:h-10 sm:px-4 sm:text-[13px]"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="hidden sm:inline">Tambah</span>
          </button>
        </div>
      </div>

      {/* Kotak folder */}
      <div className="overflow-hidden rounded-b-[12px] border border-[#e6ebf1] bg-white shadow-[0_6px_20px_rgba(22,73,116,0.08)] dark:border-white/10 dark:bg-[#2a3350]">
        <div className="overflow-x-auto">
          {filtered.length > 0 ? (
            <table className="w-full min-w-[700px] table-fixed border-collapse text-left">
              <thead>
                <tr className="bg-[#f6f2fb]">
                  <th className={`${thCls} w-[30%]`}>Nama</th>
                  <th className={`${thCls} w-[35%]`}>Email</th>
                  <th className={`${thCls} w-[20%]`}>Divisi</th>
                  <th className={`${thCls} w-[15%]`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className={rowCls}>
                    <td className={tdCls}>
                      <div className="flex items-center gap-2.5">
                        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[#deedf8] text-[13px] font-bold text-[#001192] dark:bg-white/10 dark:text-[#4258ff]">
                          {a.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate font-medium text-[#4e5968] dark:text-white">
                          {a.name}
                        </span>
                      </div>
                    </td>
                    <td className={tdCls}>{a.email}</td>
                    <td className={tdCls}>{a.divisi || "—"}</td>
                    <td className={tdCls}>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(a)}
                          title="Edit"
                          aria-label={`Edit ${a.name}`}
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
                          onClick={() => handleDelete(a)}
                          disabled={deleteBusy === a.id}
                          title="Hapus"
                          aria-label={`Hapus ${a.name}`}
                          className="grid size-8 cursor-pointer place-items-center rounded-[8px] text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-white/10"
                        >
                          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
                            <path
                              d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-[25px] py-[42px] text-center text-[13px] text-[#8491a1]">
              Belum ada {activeRole.long.toLowerCase()} yang cocok.
            </p>
          )}
        </div>
      </div>

      {/* Modal tambah/edit */}
      {modal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={closeModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[10px] border border-[#d9d9d9] bg-white p-5 shadow-[0_0_48px_0_rgba(0,0,0,0.35)] dark:border-white/10 dark:bg-black sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[20px] font-bold text-black dark:text-white">
                {modal.mode === "add"
                  ? `Tambah ${ROLES.find((r) => r.key === modal.role)!.long}`
                  : `Edit ${ROLES.find((r) => r.key === modal.approver.role)?.long ?? "Approver"}`}
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

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
              <input type="hidden" name="role" value={modal.mode === "add" ? modal.role : modal.approver.role} />
              <div>
                <label htmlFor="ap-name" className={labelClass}>
                  Nama Lengkap
                </label>
                <input
                  id="ap-name"
                  name="name"
                  type="text"
                  required
                  defaultValue={modal.mode === "edit" ? modal.approver.name : ""}
                  placeholder="Contoh: Budi Santoso"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="ap-email" className={labelClass}>
                  Email
                </label>
                <input
                  id="ap-email"
                  name="email"
                  type="email"
                  required
                  defaultValue={modal.mode === "edit" ? modal.approver.email : ""}
                  placeholder="nama@perusahaan.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="ap-divisi" className={labelClass}>
                  Divisi
                </label>
                <input
                  id="ap-divisi"
                  name="divisi"
                  type="text"
                  defaultValue={modal.mode === "edit" ? (modal.approver.divisi ?? "") : ""}
                  placeholder="Contoh: Divisi Teknologi Informasi"
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="mt-2 w-full rounded-[10px] bg-[#5E46FF] py-3 text-[16px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? "Menyimpan..." : "Simpan"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
