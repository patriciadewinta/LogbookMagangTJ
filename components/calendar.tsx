"use client";

import { useState } from "react";

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

export default function Calendar() {
  const [view, setView] = useState(() => new Date());
  const year = view.getFullYear();
  const month = view.getMonth();

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => setView(new Date(year, month - 1, 1));
  const nextMonth = () => setView(new Date(year, month + 1, 1));

  return (
    <div className="w-full max-w-[292px] shrink-0 rounded-2xl border border-[#d9d9d9] bg-white/80 p-4 shadow-md dark:border-white/10 dark:bg-black/100 lg:mx-0 mx-auto">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          aria-label="Bulan sebelumnya"
          className="grid size-9 cursor-pointer place-items-center rounded-full text-black/60 transition-colors hover:bg-black/5 dark:text-white/75 dark:hover:bg-white/10"
        >
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-black dark:text-white">
          {MONTH_LABELS[month]} {year}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          aria-label="Bulan berikutnya"
          className="grid size-9 cursor-pointer place-items-center rounded-full text-black/60 transition-colors hover:bg-black/5 dark:text-white/75 dark:hover:bg-white/10"
        >
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Tinggi selalu cukup untuk 6 baris (202px = 6×32px + 5×2px gap) supaya
          layout homepage nggak lompat saat ganti bulan (Feb 4 minggu, Mei 6). */}
      <div className="mt-3 grid h-[202px] auto-rows-fr grid-cols-7 gap-y-0.5">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="grid h-8 place-items-center text-xs font-normal text-[#757575] dark:text-white/70"
          >
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          const isToday =
            day !== null && `${year}-${month}-${day}` === todayKey;
          return (
            <div key={i} className="grid place-items-center">
              {day !== null ? (
                <span
                  className={`grid size-7 place-items-center rounded-full text-xs ${
                    isToday
                      ? "bg-[#0043ce] font-semibold text-white"
                      : "text-black dark:text-white"
                  }`}
                >
                  {day}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
