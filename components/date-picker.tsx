"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// Date picker iOS-style, adaptasi dari EXAMPLES/calendar.jsx (date-only).
const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function buildMonthGrid(year: number, month: number) {
  const firstDayOffset = new Date(year, month, 1).getDay(); // 0=Min
  const total = daysInMonth(year, month);
  const prevTotal = daysInMonth(year, month - 1 < 0 ? 11 : month - 1);
  const cells: { day: number; inMonth: boolean; offset: -1 | 0 | 1 }[] = [];

  for (let i = firstDayOffset - 1; i >= 0; i--) {
    cells.push({ day: prevTotal - i, inMonth: false, offset: -1 });
  }
  for (let d = 1; d <= total; d++) {
    cells.push({ day: d, inMonth: true, offset: 0 });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: cells.length - (firstDayOffset + total) + 1, inMonth: false, offset: 1 });
  }
  return cells;
}

function sameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toDate(v: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatLabel(d: Date) {
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export default function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = "Pilih tanggal",
  className = "",
  disabled = false,
  ariaLabel = "Pilih tanggal",
  disabledDates,
  disableWeekends = false,
}: {
  value: string;
  onChange: (v: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  // Tanggal ISO (YYYY-MM-DD) yang tidak boleh dipilih (mis. hari libur).
  disabledDates?: string[];
  // Disable Sabtu/Minggu.
  disableWeekends?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  // Popover fixed-position supaya tidak ke-clip container overflow-y-auto.
  const [popPos, setPopPos] = useState<{ left: number; top: number } | null>(null);
  const selected = toDate(value);
  const now = new Date();
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? now.getMonth());

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const reposition = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const left = Math.max(8, Math.min(r.left, window.innerWidth - 328));
    setPopPos({ left, top: r.bottom + 6 });
  };

  const toggleOpen = () => {
    if (open) {
      setOpen(false);
    } else {
      reposition();
      setOpen(true);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onMove = () => reposition();
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };
  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const minDate = toDate(min ?? "");
  const maxDate = toDate(max ?? "");
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const disabledSet = useMemo(() => new Set(disabledDates ?? []), [disabledDates]);

  const cellDate = (cell: { day: number; offset: -1 | 0 | 1 }) => {
    let y = viewYear;
    let m = viewMonth;
    if (cell.offset === -1) {
      m -= 1;
      if (m < 0) {
        m = 11;
        y -= 1;
      }
    } else if (cell.offset === 1) {
      m += 1;
      if (m > 11) {
        m = 0;
        y += 1;
      }
    }
    return new Date(y, m, cell.day);
  };

  const disabledDate = (d: Date) => {
    if (minDate && d < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) return true;
    if (maxDate && d > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())) return true;
    if (disableWeekends && (d.getDay() === 0 || d.getDay() === 6)) return true;
    if (disabledSet.has(toISO(d))) return true;
    return false;
  };

  const pickDay = (cell: { day: number; offset: -1 | 0 | 1 }) => {
    const d = cellDate(cell);
    if (disabledDate(d)) return;
    if (cell.offset !== 0) {
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
    onChange(toISO(d));
    setOpen(false);
  };

  const pickNow = () => {
    const d = new Date();
    const base = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    let target = base;
    if (minDate && base < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) target = minDate;
    if (maxDate && base > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())) target = maxDate;
    // "Sekarang" jatuh di tanggal libur → mundur ke hari kerja terdekat.
    let guard = 0;
    while (disabledDate(target) && guard++ < 31) {
      target = new Date(target.getFullYear(), target.getMonth(), target.getDate() - 1);
    }
    if (disabledDate(target)) return;
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
    onChange(toISO(target));
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        type="button"
        ref={btnRef}
        disabled={disabled}
        aria-label={ariaLabel}
        onClick={toggleOpen}
        className={`flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-[10px] border border-[#d9d9d9] bg-white px-3 text-left text-[16px] outline-none transition-colors focus:border-[#001192] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/25 dark:bg-black dark:focus:border-[#4258ff] ${
          value ? "text-black dark:text-white" : "text-black/30 dark:text-white/55"
        }`}
      >
        <span>{selected ? formatLabel(selected) : placeholder}</span>
        <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-black/40 dark:text-white/65" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M8 3v4M16 3v4M3 11h18" strokeLinecap="round" />
        </svg>
      </button>

      {open && popPos && (
        <div
          role="dialog"
          aria-label="Kalender"
          style={{ position: "fixed", left: popPos.left, top: popPos.top }}
          className="z-50 w-[320px] rounded-[20px] border border-black/[0.06] bg-white p-0 shadow-[0_10px_40px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-[#1c1c1e]"
        >
          {/* Header summary */}
          <div className="border-b border-black/[0.08] px-5 pb-3.5 pt-4 dark:border-white/10">
            <div className="text-[12px] font-semibold uppercase tracking-wide text-[#8e8e93]">Tanggal</div>
            <div className="mt-1 text-[17px] font-semibold text-black dark:text-white">
              {selected ? formatLabel(selected) : "Pilih tanggal"}
            </div>
          </div>

          {/* Nav bulan */}
          <div className="flex items-center justify-between px-4 pt-4">
            <button
              type="button"
              onClick={goPrevMonth}
              aria-label="Bulan sebelumnya"
              className="grid size-8 cursor-pointer place-items-center rounded-full text-[22px] font-medium text-[#007aff] transition-colors hover:bg-black/5 dark:text-[#4258ff] dark:hover:bg-white/10"
            >
              ‹
            </button>
            <div className="text-[16px] font-semibold text-black dark:text-white">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </div>
            <button
              type="button"
              onClick={goNextMonth}
              aria-label="Bulan berikutnya"
              className="grid size-8 cursor-pointer place-items-center rounded-full text-[22px] font-medium text-[#007aff] transition-colors hover:bg-black/5 dark:text-[#4258ff] dark:hover:bg-white/10"
            >
              ›
            </button>
          </div>

          {/* Nama hari */}
          <div className="mt-3 grid grid-cols-7">
            {DAY_NAMES.map((d) => (
              <div key={d} className="py-1 text-center text-[11px] font-semibold text-[#8e8e93]">
                {d}
              </div>
            ))}
          </div>

          {/* Grid tanggal */}
          <div className="grid grid-cols-7 px-1 pb-1">
            {grid.map((cell, i) => {
              const d = cellDate(cell);
              const isSelected = selected ? sameDate(d, selected) : false;
              const isToday = sameDate(d, today);
              const isDisabled = disabledDate(d);
              return (
                <div key={i} className="flex h-[38px] items-center justify-center">
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => pickDay(cell)}
                    className={`grid size-8 place-items-center rounded-full text-[15px] transition-transform active:scale-90 ${
                      isSelected
                        ? "bg-[#007aff] font-semibold text-white dark:bg-[#4258ff]"
                        : cell.inMonth
                          ? isToday
                            ? "font-semibold text-[#007aff] dark:text-[#4258ff]"
                            : "text-black dark:text-white"
                          : "text-[#c7c7cc] dark:text-white/50"
                    } ${isDisabled ? "cursor-not-allowed opacity-30" : "cursor-pointer hover:bg-black/5 dark:hover:bg-white/10"}`}
                  >
                    {cell.day}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex border-t border-black/[0.08] dark:border-white/10">
            <button
              type="button"
              onClick={pickNow}
              className="flex-1 cursor-pointer py-3.5 text-[16px] text-[#007aff] transition-colors hover:bg-black/[0.03] dark:text-[#4258ff] dark:hover:bg-white/5"
            >
              Sekarang
            </button>
            <div className="w-px bg-black/[0.08] dark:bg-white/10" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 cursor-pointer py-3.5 text-[16px] font-semibold text-[#007aff] transition-colors hover:bg-black/[0.03] dark:text-[#4258ff] dark:hover:bg-white/5"
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
