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
  iconOnly = false,
}: {
  path: string;
  bucket: "logbooks" | "ktm";
  label: string;
  className?: string;
  own?: boolean;
  submissionId?: string;
  iconOnly?: boolean;
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

  const icon = (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M12 3v12m0 0l-4-4m4 4l4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" />
    </svg>
  );

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={!path || pending}
        title={label}
        aria-label={label}
        className={`grid size-[29px] place-items-center rounded-[5px] bg-[#31c7d0] text-white transition-transform hover:-translate-y-px hover:bg-[#1aadb6] disabled:cursor-not-allowed disabled:opacity-50 ${className ?? ""}`}
      >
        <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 3v12m0 0l-4-4m4 4l4-4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" />
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!path || pending}
      className={`inline-flex items-center gap-1.5 rounded-[10px] bg-[#00D4D8] px-4 py-1.5 text-[14px] font-bold text-[#003334] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${className ?? ""}`}
    >
      {icon}
      {pending ? "Mengunduh..." : label}
    </button>
  );
}
