"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSalaryPerDay } from "@/app/actions";
import { useToast } from "@/components/toast-provider";

export default function SalarySettingForm({ initialValue }: { initialValue: number }) {
  const router = useRouter();
  const toast = useToast();
  const [value, setValue] = useState(String(initialValue));
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const fd = new FormData();
    fd.set("salaryPerDay", value);
    const res = await updateSalaryPerDay(fd);
    setBusy(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Pengaturan gaji per hari tersimpan.");
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
