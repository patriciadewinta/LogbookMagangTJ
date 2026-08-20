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
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] shrink-0 flex-col bg-[#001192] text-white shadow-2xl transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:h-screen lg:w-[243px] lg:max-w-none lg:translate-x-0 lg:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between px-5 pt-5">
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

        <nav className="mt-5 flex flex-col gap-1.5 px-[14px]">
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

        <div className="mt-auto px-[14px] pb-[max(env(safe-area-inset-bottom),20px)]">
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
