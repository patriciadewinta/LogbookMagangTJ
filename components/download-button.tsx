"use client";

import { useState } from "react";
import { downloadFile, downloadOwnFile } from "@/app/actions";

export default function DownloadButton({
  path,
  bucket,
  label,
  className,
  own = false,
  submissionId,
}: {
  path: string;
  bucket: "logbooks" | "ktm";
  label: string;
  className?: string;
  own?: boolean;
  submissionId?: string;
}) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (!path || pending) return;
    setPending(true);
    try {
      const res = own
        ? await downloadOwnFile(path, bucket, submissionId)
        : await downloadFile(path, bucket, submissionId);
      if (res?.url) window.open(res.url, "_blank", "noopener");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!path || pending}
      className={`inline-flex items-center gap-1.5 rounded-[10px] bg-[#00D4D8] px-4 py-1.5 text-[14px] font-bold text-[#003334] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${className ?? ""}`}
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M12 3v12m0 0l-4-4m4 4l4-4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" />
      </svg>
      {pending ? "Mengunduh..." : label}
    </button>
  );
}
