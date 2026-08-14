"use client";

import { useEffect, useState } from "react";

export default function Toast({ duration = 4500 }: { duration?: number }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHidden(true), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (hidden) return null;

  return (
    <div
      role="status"
      className={`pointer-events-none fixed left-1/2 top-6 z-[60] w-[475px] max-w-[90vw] ${
        hidden ? "toast-out" : "toast-in"
      }`}
    >
      <div className="relative overflow-hidden rounded-2xl p-3 shadow-[0px_8px_40px_0px_rgba(0,0,0,0.12)]">
        <div
          aria-hidden
          className="absolute inset-0 bg-[#262626] mix-blend-color-dodge"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[rgba(245,245,245,0.67)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[rgba(0,0,0,0.2)] mix-blend-screen"
        />
        <div className="relative flex items-start gap-3">
          <img
            src="/assets/check-mark.png"
            alt=""
            aria-hidden="true"
            className="size-10 shrink-0 object-contain"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold tracking-[-0.3px] text-[rgba(0,0,0,0.85)]">
              Logbook Magang berhasil disubmit!
            </p>
            <p className="mt-0.5 text-[15px] leading-snug text-[rgba(0,0,0,0.85)]">
              Silahkan memantau status laporan pada beranda
            </p>
          </div>
          <span className="shrink-0 text-[11px] leading-[14px] text-[#bfbfbf]">
            now
          </span>
        </div>
      </div>
    </div>
  );
}
