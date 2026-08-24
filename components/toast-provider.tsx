"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type ToastType = "success" | "error" | "warning";

type ToastItem = {
  id: number;
  type: ToastType;
  title: string;
  message: string;
  duration: number;
};

type ToastApi = {
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast harus dipakai di dalam <ToastProvider>");
  return ctx;
}

const TYPE_STYLE: Record<
  ToastType,
  { bubble: string; icon: React.ReactNode; defaults: { title: string; duration: number } }
> = {
  success: {
    bubble: "bg-[#e3f6e8] text-[#147d2e] dark:bg-white/10 dark:text-[#5ee08a]",
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.1V12a10 10 0 11-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    defaults: { title: "Berhasil", duration: 4000 },
  },
  error: {
    bubble: "bg-[#fde3e3] text-[#b42318] dark:bg-white/10 dark:text-[#ff8a80]",
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    defaults: { title: "Gagal", duration: 5000 },
  },
  warning: {
    bubble: "bg-[#fdf3dc] text-[#9a6b00] dark:bg-white/10 dark:text-[#ffd25e]",
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
      </svg>
    ),
    defaults: { title: "Perhatian", duration: 4500 },
  },
};

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  // "enter" → mulai di luar frame kanan; "show" → slide masuk; "exit" → slide keluar lagi.
  const [phase, setPhase] = useState<"enter" | "show" | "exit">("enter");

  useEffect(() => {
    const raf = requestAnimationFrame(() => setPhase("show"));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (phase !== "show") return;
    const timer = setTimeout(() => setPhase("exit"), toast.duration);
    return () => clearTimeout(timer);
  }, [phase, toast.duration]);

  useEffect(() => {
    if (phase !== "exit") return;
    const timer = setTimeout(() => onDismiss(toast.id), 350);
    return () => clearTimeout(timer);
  }, [phase, toast.id, onDismiss]);

  const style = TYPE_STYLE[toast.type];

  return (
    <div
      role="status"
      onClick={() => setPhase("exit")}
      className={`pointer-events-auto flex w-[340px] max-w-[calc(100vw-48px)] cursor-pointer items-start gap-3 rounded-[10px] border border-[#e6ebf1] bg-white p-3.5 shadow-[0_6px_20px_rgba(22,73,116,0.15)] transition-all duration-300 ease-out dark:border-white/10 dark:bg-[#2a3350] ${
        phase === "show"
          ? "translate-x-0 opacity-100"
          : "translate-x-[calc(100%+40px)] opacity-0"
      }`}
    >
      <div className={`grid size-9 shrink-0 place-items-center rounded-[8px] ${style.bubble}`}>
        {style.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-black dark:text-white">{toast.title}</p>
        <p className="mt-0.5 text-[13px] leading-snug text-[#4e5968] dark:text-white/70">
          {toast.message}
        </p>
      </div>
    </div>
  );
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type: ToastType, message: string, title?: string) => {
    const style = TYPE_STYLE[type];
    setToasts((current) => [
      ...current.slice(-4),
      {
        id: nextId.current++,
        type,
        title: title ?? style.defaults.title,
        message,
        duration: style.defaults.duration,
      },
    ]);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (m, t) => push("success", m, t),
      error: (m, t) => push("error", m, t),
      warning: (m, t) => push("warning", m, t),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[80] flex flex-col items-end gap-2.5">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
