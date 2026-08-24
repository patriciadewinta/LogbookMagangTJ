import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const TAHAP_LABEL: Record<string, string> = {
  pembimbing: "Pembimbing",
  kadep: "Kepala Departemen",
  kadiv: "Kepala Divisi",
};

const fmtWIB = (d: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d) + " WIB";

// Warna semantik iOS: hijau = terverifikasi, biru = berjalan, merah = ditolak.
const GREEN = "#34c759";
const BLUE = "#007aff";
const RED = "#ff3b30";

function CheckIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-6 shrink-0" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 shrink-0 text-black/25 dark:text-white/30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export default async function VerifikasiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const submission = await prisma.logbookSubmission.findUnique({
    where: { id },
    include: { approvalTokens: { orderBy: { createdAt: "asc" } } },
  });
  if (!submission) notFound();

  const profile = await prisma.profile.findUnique({
    where: { id: submission.userId },
    select: { fullName: true, nim: true, university: true, posisi: true },
  });

  const rejected = submission.status === "rejected";
  const verified = submission.status === "kadiv_approved";
  const accent = rejected ? RED : verified ? GREEN : BLUE;

  const periode =
    submission.periodYear && submission.periodMonth
      ? `1 ${BULAN[submission.periodMonth - 1]} – ${new Date(
          submission.periodYear,
          submission.periodMonth,
          0
        ).getDate()} ${BULAN[submission.periodMonth - 1]} ${submission.periodYear}`
      : "-";

  const tahap = ["pembimbing", "kadep", "kadiv"] as const;
  const tokenByTahap = new Map(submission.approvalTokens.map((t) => [t.tahap, t]));
  const namaByTahap: Record<string, string | null> = {
    pembimbing: submission.pembimbingName,
    kadep: submission.kadepName,
    kadiv: submission.kadivName,
  };
  const signedCount = tahap.filter((t) => tokenByTahap.get(t)?.usedAt).length;

  const headline = rejected
    ? "Logbook Ditolak"
    : verified
      ? "Logbook Terverifikasi"
      : "Menunggu Persetujuan";
  const subline = rejected
    ? submission.rejectionReason || "Logbook ini ditolak dan perlu diperbaiki."
    : verified
      ? "Semua pihak telah menandatangani logbook ini."
      : `${signedCount} dari 3 penandatangan telah menandatangani.`;

  const card =
    "rounded-2xl bg-white dark:bg-[#2c2c2e]";
  const label =
    "text-[13px] leading-6 text-[#3c3c43]/60 dark:text-white/50";

  return (
    <div className="min-h-screen bg-[#f2f2f7] py-10 dark:bg-black" style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
      <main className="mx-auto w-full max-w-[420px] px-4">
        {/* Hero: satu pesan — status keaslian logbook */}
        <header className="flex flex-col items-center text-center">
          <img src="/assets/logo-tj.png" alt="" className="mb-5 size-14 rounded-[14px] object-cover dark:hidden" />
          <img src="/assets/logo-tj-dark.png" alt="" className="mb-5 hidden size-14 rounded-[14px] object-cover dark:block" />

          <div
            className="grid size-20 place-items-center rounded-full"
            style={{ background: `${accent}1a` }}
          >
            {rejected ? (
              <svg viewBox="0 0 24 24" className="size-10" fill="none" stroke={RED} strokeWidth="2.5" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <CheckIcon color={accent} />
            )}
          </div>

          <h1 className="mt-5 text-[28px] font-bold leading-tight tracking-tight text-black dark:text-white">
            {headline}
          </h1>
          <p className="mt-1.5 max-w-[300px] text-[15px] leading-snug text-[#3c3c43]/70 dark:text-white/60">
            {subline}
          </p>
          <p className="mt-3 text-[17px] font-semibold text-black dark:text-white">
            {profile?.fullName ?? "-"}
          </p>
          <p className="text-[14px] text-[#3c3c43]/60 dark:text-white/50">{periode}</p>
        </header>

        {/* Identitas */}
        <section className="mt-8">
          <h2 className="mb-2 px-4 text-[13px] font-semibold uppercase tracking-wide text-[#3c3c43]/50 dark:text-white/40">
            Identitas Peserta
          </h2>
          <dl className={`${card} divide-y divide-black/[0.07] dark:divide-white/[0.1]`}>
            {[
              ["Nama", profile?.fullName ?? "-"],
              ["NIM", profile?.nim ?? "-"],
              ["Universitas", profile?.university ?? "-"],
              ["Posisi", profile?.posisi ?? "-"],
              ["Hari Hadir", `${submission.hadirCount ?? "-"} hari`],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
                <dt className={label}>{k}</dt>
                <dd className="text-right text-[15px] font-medium text-black dark:text-white">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Dibuat oleh */}
        <section className="mt-6">
          <h2 className="mb-2 px-4 text-[13px] font-semibold uppercase tracking-wide text-[#3c3c43]/50 dark:text-white/40">
            Dibuat Oleh
          </h2>
          <div className={`${card} flex items-center gap-3 px-4 py-3`}>
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#007aff]/10 text-[15px] font-bold text-[#007aff] dark:bg-[#4258ff]/20 dark:text-[#4258ff]">
              {(profile?.fullName ?? "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-black dark:text-white">
                {profile?.fullName ?? "-"}
              </p>
              <p className="text-[13px] text-[#3c3c43]/60 dark:text-white/50">Peserta Magang</p>
            </div>
            <p className="shrink-0 text-right text-[12px] leading-4 text-[#3c3c43]/60 dark:text-white/50">
              {fmtWIB(submission.createdAt)}
            </p>
          </div>
        </section>

        {/* Riwayat persetujuan */}
        <section className="mt-6">
          <h2 className="mb-2 px-4 text-[13px] font-semibold uppercase tracking-wide text-[#3c3c43]/50 dark:text-white/40">
            Ditandatangani Oleh
          </h2>
          <div className={`${card} divide-y divide-black/[0.07] dark:divide-white/[0.1]`}>
            {tahap.map((t) => {
              const token = tokenByTahap.get(t);
              const approved = token?.usedAt ?? null;
              return (
                <div key={t} className="flex items-center gap-3 px-4 py-3">
                  {approved ? <CheckIcon color={GREEN} /> : <ClockIcon />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-black dark:text-white">
                      {token?.approverName ?? namaByTahap[t] ?? "-"}
                    </p>
                    <p className="text-[13px] text-[#3c3c43]/60 dark:text-white/50">
                      {TAHAP_LABEL[t]}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 text-right text-[12px] leading-4 ${
                      approved
                        ? "font-semibold text-[#34c759]"
                        : "text-[#3c3c43]/50 dark:text-white/40"
                    }`}
                  >
                    {approved ? fmtWIB(approved) : "Menunggu"}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Trust footer */}
        <footer className="mt-8 px-4 text-center">
          <p className="text-[12px] leading-5 text-[#3c3c43]/50 dark:text-white/40">
            Data ini diverifikasi langsung dari basis data resmi Logbook Magang TJ.
            Hasil pemindaian mencerminkan status terkini pada {fmtWIB(new Date())}.
          </p>
        </footer>
      </main>
    </div>
  );
}
