"use client";

import { ViewTransition } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions";

export type NavItem = { href: string; label: string; icon: string };
export type SidebarUser = { name: string; email: string; avatarUrl: string | null };

export default function SidebarShell({
  navItems,
  activeClass,
  user,
}: {
  navItems: NavItem[];
  activeClass: string;
  user: SidebarUser;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  // Lock body scroll while mobile drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  // Close drawer on route change (browser back / history nav)
  useEffect(() => {
    close();
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buka menu"
        title="Buka menu"
        className="fixed left-4 top-4 z-50 grid size-11 cursor-pointer place-items-center rounded-full border border-black/10 bg-white/80 shadow-lg backdrop-blur-md transition-transform active:scale-90 lg:hidden dark:border-white/15 dark:bg-black/40"
      >
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
        </svg>
      </button>

      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={close}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] shrink-0 flex-col overflow-hidden bg-[#101C98] text-white shadow-2xl transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:h-screen lg:w-[243px] lg:max-w-none lg:translate-x-0 lg:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Dekorasi: wave lines + siluet bus di atas blok profil (kalau
            bottom-0 dia ketutup baris user), opacity rendah biar lembut. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[110px] select-none">
          <div className="relative pt-[64px]">
            <svg
              viewBox="0 0 243 160"
              fill="none"
              className="absolute inset-0 h-full w-full"
            >
              <defs>
                {/* Main soft wave */}
                <linearGradient
                  id="sb-wave-main"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
                >
                  <stop offset="0" stopColor="#fff" stopOpacity="0" />
                  <stop offset="0.35" stopColor="#fff" stopOpacity="0.08" />
                  <stop offset="0.75" stopColor="#fff" stopOpacity="0.18" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0.08" />
                </linearGradient>

                {/* Secondary wave */}
                <linearGradient
                  id="sb-wave-soft"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
                >
                  <stop offset="0" stopColor="#fff" stopOpacity="0" />
                  <stop offset="0.45" stopColor="#fff" stopOpacity="0.07" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0.12" />
                </linearGradient>

                {/* Bottom accent */}
                <linearGradient
                  id="sb-ground"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
                >
                  <stop offset="0" stopColor="#fff" stopOpacity="0" />
                  <stop offset="0.25" stopColor="#fff" stopOpacity="0.08" />
                  <stop offset="0.7" stopColor="#fff" stopOpacity="0.16" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0.04" />
                </linearGradient>
              </defs>

              {/* Large abstract arc */}
              <path
                d="M-20 86
                   C 22 42, 70 30, 112 48
                   C 154 66, 190 58, 270 18"
                stroke="url(#sb-wave-main)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />

              {/* Secondary flowing wave */}
              <path
                d="M-18 105
                   C 30 64, 76 58, 116 72
                   C 158 87, 198 78, 265 42"
                stroke="url(#sb-wave-soft)"
                strokeWidth="1"
                strokeLinecap="round"
              />

              {/* Short abstract curve */}
              <path
                d="M-12 122
                   C 24 96, 58 94, 84 103
                   C 108 111, 128 110, 151 99"
                stroke="url(#sb-wave-soft)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />

              {/* Very subtle lower motion line */}
              <path
                d="M-20 151
                   C 48 137, 126 138, 205 151
                   C 224 154, 240 154, 260 150"
                stroke="url(#sb-ground)"
                strokeWidth="1.3"
                strokeLinecap="round"
              />

              {/* Bubble kecil di sepanjang aliran arc */}
              <circle
                cx="186"
                cy="72"
                r="3"
                fill="#fff"
                fillOpacity="0.12"
              />
              <circle
                cx="205"
                cy="59"
                r="1.8"
                fill="#fff"
                fillOpacity="0.16"
              />
              <circle
                cx="221"
                cy="92"
                r="5"
                fill="#fff"
                fillOpacity="0.06"
              />
            </svg>
            {/* Dekorasi bus — ilustrasi putih di transparan, opacity 30%.
                z-10 biar garis aliran tampak di belakangnya */}
            <img
              src="/assets/bus-decor.png"
              alt=""
              className="relative z-10 -mx-[17.5%] w-[140%] max-w-none opacity-15"
            />
          </div>
        </div>
        <div className="relative flex items-start justify-between px-5 pt-5">
          <div className="flex flex-1 justify-center">
            <ViewTransition name="logo-tj" default="block">
              <img
                src="/assets/logo-tj-dark.png"
                alt="Logo Tj"
                className="size-[96px] rounded-[10px] object-cover"
              />
            </ViewTransition>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Tutup menu"
            title="Tutup menu"
            className="-mr-2 grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="relative mt-5 flex flex-col gap-1.5 px-[14px]">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={`flex items-center gap-4 rounded-[10px] px-4 py-3 transition-colors ${
                  active ? activeClass : "hover:bg-white/10"
                }`}
              >
                <img
                  src={item.icon}
                  alt=""
                  className="size-7 object-contain"
                />
                <span className="text-[20px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="relative mt-auto px-[14px] pb-[max(env(safe-area-inset-bottom),20px)]">
          <img
            src="/assets/sidebar-line.svg"
            alt=""
            className="w-full"
          />
          <div className="mt-4 flex items-center gap-3">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="Foto profil"
                className="size-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[15px] font-bold text-[#001192]">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold leading-tight">{user.name}</p>
              <p className="truncate text-[11px] font-light text-white/80">
                {user.email}
              </p>
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              title="Logout"
              aria-label="Logout"
              className="ml-auto grid size-9 cursor-pointer place-items-center rounded-full transition-colors hover:bg-white/10"
            >
              <img
                src="/assets/sidebar-logout.png"
                alt=""
                className="size-7 object-contain"
              />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
