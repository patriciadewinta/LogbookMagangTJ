"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSalaryPerDay } from "@/app/actions";

export default function SalarySettingForm({ initialValue }: { initialValue: number }) {
  const router = useRouter();
  const [value, setValue] = useState(String(initialValue));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    const fd = new FormData();
    fd.set("salaryPerDay", value);
    const res = await updateSalaryPerDay(fd);
    setBusy(false);
    if (res?.error) {
      setError(res.error);
    } else {
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
      <div>
        <label
          htmlFor="salary-per-day"
          className="mb-1 block text-sm text-[#1f2937] dark:text-white"
        >
          Gaji per hari (Rp)
        </label>
        <input
          id="salary-per-day"
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          min={1}
          required
          className="h-9 w-full rounded-lg border border-[#d9d9d9] bg-white px-3 text-sm text-[#1f2937] outline-none focus:border-[#001192] dark:border-white/10 dark:bg-black dark:text-white dark:focus:border-[#4258ff]"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      {saved && (
        <p className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-xs text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          Tersimpan.
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-fit rounded-lg bg-[#4258FF] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#374adf] disabled:opacity-60"
      >
        {busy ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}
