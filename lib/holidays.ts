import { prisma } from "@/lib/prisma";

// Sumber libur: Google Calendar publik Indonesia
// (id.indonesian#holiday@group.v.calendar.google.com) — gratis, tanpa API key,
// memuat libur nasional + cuti bersama SKB. .ics di-filter ke entri yang
// DESCRIPTION-nya "Hari libur nasional" (buang yang "Perayaan").
const ICS_URL =
  "https://calendar.google.com/calendar/ical/id.indonesian%23holiday%40group.v.calendar.google.com/public/basic.ics";

type HolidayInput = { date: string; name: string; type: "libur_nasional" | "cuti_bersama" };

function unescapeIcs(s: string) {
  return s.replace(/\\n/g, " ").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
}

export async function fetchIndonesianHolidays(year: number): Promise<HolidayInput[]> {
  const res = await fetch(ICS_URL, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`Gagal fetch kalender libur: ${res.status}`);
  const text = await res.text();

  const out: HolidayInput[] = [];
  for (const chunk of text.split("BEGIN:VEVENT").slice(1)) {
    // Gabungkan baris ter-folding (diawali spasi) agar nilai panjang tidak terpotong.
    const joined: string[] = [];
    for (const raw of chunk.replace(/\r\n/g, "\n").split("\n")) {
      if ((raw.startsWith(" ") || raw.startsWith("\t")) && joined.length) {
        joined[joined.length - 1] += raw.trim();
      } else {
        joined.push(raw);
      }
    }

    const dtstart = joined.find((l) => l.startsWith("DTSTART"));
    const dateMatch = dtstart?.match(/(\d{4})(\d{2})(\d{2})/);
    if (!dateMatch) continue;

    const summary = unescapeIcs(joined.find((l) => l.startsWith("SUMMARY"))?.slice(8) ?? "").trim();
    const description = unescapeIcs(
      joined.find((l) => l.startsWith("DESCRIPTION"))?.slice(12) ?? ""
    ).trim();
    if (!summary || !description.toLowerCase().includes("hari libur nasional")) continue;

    const [, y, m, d] = dateMatch;
    if (Number(y) !== year) continue;

    out.push({
      date: `${y}-${m}-${d}`,
      name: summary,
      type: summary.toLowerCase().startsWith("cuti bersama") ? "cuti_bersama" : "libur_nasional",
    });
  }
  return out;
}

export async function syncHolidays(year: number): Promise<void> {
  const existing = await prisma.holiday.count({ where: { year } });
  if (existing > 0) return;
  const holidays = await fetchIndonesianHolidays(year);
  if (holidays.length === 0) return;
  await prisma.holiday.createMany({
    data: holidays.map((h) => ({ ...h, isLibur: true, year })),
    skipDuplicates: true,
  });
}

// Hari kerja efektif sebulan: total hari − Sabtu/Minggu − libur (libur_nasional
// selalu; cuti_bersama hanya jika isLibur=true, karena sebagian tanggal cuti
// bersama kadang tetap diwajibkan masuk).
// Cache in-memory: jumlah hari kerja per bulan hampir tidak berubah, jadi
// tidak perlu sync + query DB di tiap request home.
const workdayCache = new Map<string, { value: number; at: number }>();
const WORKDAY_TTL = 60 * 60 * 1000; // 1 jam

// Dipanggil setelah CRUD hari libur dari halaman OD biar hitungan hari kerja
// tidak memakai cache basi.
export function clearWorkdayCache() {
  workdayCache.clear();
}

export async function getWorkdayCount(year: number, month: number): Promise<number> {
  const key = `${year}-${month}`;
  const cached = workdayCache.get(key);
  if (cached && Date.now() - cached.at < WORKDAY_TTL) return cached.value;

  const value = await computeWorkdayCount(year, month);
  workdayCache.set(key, { value, at: Date.now() });
  return value;
}

async function computeWorkdayCount(year: number, month: number): Promise<number> {
  try {
    await syncHolidays(year);
  } catch {
    // API libur tidak bisa diakses — fallback hitung weekend saja.
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const holidays = await prisma.holiday.findMany({
    where: { year, isLibur: true },
    select: { date: true },
  });
  const holidaySet = new Set(holidays.map((h) => h.date));

  let workdays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month - 1, d).getDay();
    if (dow === 0 || dow === 6) continue;
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (holidaySet.has(iso)) continue;
    workdays++;
  }
  return workdays;
}
