"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getTheme(): "light" | "dark" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function emit() {
  listeners.forEach((cb) => cb());
}

function toggleTheme() {
  const root = document.documentElement;
  const next = root.classList.toggle("dark");
  localStorage.setItem("theme", next ? "dark" : "light");
  root.classList.add("theme-anim");
  window.setTimeout(() => root.classList.remove("theme-anim"), 350);
  emit();
}

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light");
  const dark = theme === "dark";

  // Re-apply stored theme after React's dev remount resets <html> class.
  // No-op in production (inline script in layout already applied it).
  useLayoutEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? "Ganti ke tema terang" : "Ganti ke tema gelap"}
      title={dark ? "Ganti ke tema terang" : "Ganti ke tema gelap"}
      className={`group relative grid size-10 cursor-pointer place-items-center rounded-full border shadow-md backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#001192] dark:focus-visible:outline-[#4258ff] ${
        dark
          ? "border-white/15 bg-black/40 shadow-black/40"
          : "border-black/10 bg-white/80 shadow-black/10"
      } ${className}`}
    >
      <img
        key={dark ? "sun" : "moon"}
        src={dark ? "/assets/sun.svg" : "/assets/moon.svg"}
        alt=""
        className="theme-icon-pop size-6"
        aria-hidden="true"
      />
    </button>
  );
}
