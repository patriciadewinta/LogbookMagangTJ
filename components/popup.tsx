"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type AlertOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
};

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type PopupApi = {
  alert: (opts: AlertOptions) => Promise<void>;
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
};

type PopupState = {
  kind: "alert" | "confirm";
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  resolve: (value: boolean) => void;
};

const PopupContext = createContext<PopupApi | null>(null);

export function usePopup() {
  const ctx = useContext(PopupContext);
  if (!ctx) throw new Error("usePopup harus dipakai di dalam <PopupProvider>");
  return ctx;
}

export default function PopupProvider({ children }: { children: React.ReactNode }) {
  const [popup, setPopup] = useState<PopupState | null>(null);

  const close = useCallback((value: boolean) => {
    setPopup((current) => {
      current?.resolve(value);
      return null;
    });
  }, []);

  const open = useCallback((state: Omit<PopupState, "resolve">, resolve: (value: boolean) => void) => {
    setPopup({ ...state, resolve });
  }, []);

  const alert = useCallback(
    (opts: AlertOptions) =>
      new Promise<void>((resolve) => open({ kind: "alert", ...opts }, () => resolve())),
    [open]
  );

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => open({ kind: "confirm", ...opts }, resolve)),
    [open]
  );

  useEffect(() => {
    if (!popup) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(popup.kind === "alert");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [popup, close]);

  return (
    <PopupContext.Provider value={{ alert, confirm }}>
      {children}

      {popup && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          onClick={() => close(popup.kind === "alert")}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-[10px] border border-[#d9d9d9] bg-white p-5 shadow-[0_0_48px_0_rgba(0,0,0,0.35)] dark:border-white/10 dark:bg-black sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[20px] font-bold text-black dark:text-white">
              {popup.title ?? (popup.kind === "confirm" ? "Konfirmasi" : "Notifikasi")}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-black/70 dark:text-white/70">
              {popup.message}
            </p>

            <div className="mt-6 flex justify-end gap-2.5">
              {popup.kind === "confirm" && (
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="cursor-pointer rounded-[10px] border border-[#d9d9d9] bg-white px-4 py-2.5 text-[15px] font-semibold text-[#4e5968] transition-colors hover:bg-[#f3f4f6] dark:border-white/20 dark:bg-black dark:text-white/80 dark:hover:bg-white/10"
                >
                  {popup.cancelLabel ?? "Batal"}
                </button>
              )}
              <button
                type="button"
                onClick={() => close(true)}
                autoFocus
                className={`cursor-pointer rounded-[10px] px-4 py-2.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90 ${
                  popup.danger ? "bg-red-600" : "bg-[#5E46FF]"
                }`}
              >
                {popup.confirmLabel ?? (popup.kind === "confirm" ? "Ya, Lanjutkan" : "OK")}
              </button>
            </div>
          </div>
        </div>
      )}
    </PopupContext.Provider>
  );
}
