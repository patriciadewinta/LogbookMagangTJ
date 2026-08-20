"use client";

import { useState } from "react";
import { deleteSubmission } from "@/app/actions";

interface Props {
  submissionId: string;
  submissionName: string;
}

export default function DeleteSubmissionButton({ submissionId, submissionName }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);

    const formData = new FormData();
    formData.append("id", submissionId);

    const result = await deleteSubmission(formData);

    if (result.error) {
      setError(result.error);
      setIsDeleting(false);
    } else {
      window.location.reload();
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-[8px] border border-[#b42318] bg-transparent text-[#b42318] transition-opacity hover:opacity-80 disabled:opacity-50 dark:border-[#ff8a80] dark:text-[#ff8a80]"
        type="button"
        title="Hapus submission"
      >
        {isDeleting ? (
          <svg viewBox="0 0 24 24" className="size-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 11v6m4-6v6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[10px] border border-[#d9d9d9] bg-white p-6 dark:border-white/10 dark:bg-black">
            <h3 className="text-[20px] font-semibold text-black dark:text-white">
              Hapus Submission?
            </h3>
            <p className="mt-2 text-[16px] text-black/70 dark:text-white/70">
              Submission dari <span className="font-semibold">{submissionName}</span> akan dihapus permanen. File PDF di storage juga akan dihapus.
            </p>
            {error && (
              <p className="mt-3 text-[14px] text-[#b42318] dark:text-[#ff8a80]">
                {error}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setError(null);
                }}
                disabled={isDeleting}
                className="rounded-[8px] border border-[#d9d9d9] bg-transparent px-4 py-2 text-[14px] font-semibold text-black transition-opacity hover:opacity-80 disabled:opacity-50 dark:border-white/10 dark:text-white"
                type="button"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-[8px] bg-[#b42318] px-4 py-2 text-[14px] font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50 dark:bg-[#ff8a80]"
                type="button"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
