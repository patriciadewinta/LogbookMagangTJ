"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOD, requireUser, requireUserClient } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildLogbookNotification, sendLogbookEmail } from "@/lib/notify";
import { sendPasswordResetEmail } from "@/lib/email";
import { buildTtdUrl, createApprovalToken } from "@/lib/approval";
import { generateLogbookPdf } from "@/lib/pdf-logbook";
import { PROVINCES } from "@/lib/domisili";
import { clearWorkdayCache } from "@/lib/holidays";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const ALLOWED_KTM_EXT = [".pdf", ".jpg", ".jpeg", ".png"];
const ALLOWED_AVATAR_EXT = [".jpg", ".jpeg", ".png", ".webp"];

function getExt(name: string) {
  const dot = name.lastIndexOf(".");
  if (dot === -1) return "";
  return name.slice(dot).toLowerCase();
}

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function fileError(file: File | undefined, allowed: string[], label: string) {
  if (!file || file.size === 0) return `${label} wajib diunggah.`;
  if (file.size > MAX_FILE_SIZE) return `${label} maksimal 1MB.`;
  if (!allowed.includes(getExt(file.name)))
    return `${label} harus berformat ${allowed.join(", ")}.`;
  return null;
}

export async function signUp(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const university = String(formData.get("university") ?? "").trim();
  const domisili = String(formData.get("domisili") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");
  const ktmFile = formData.get("ktm_file") as File | null;

  if (!fullName || !university || !email || !password) {
    return { error: "Semua kolom wajib diisi." };
  }
  if (!domisili || !(PROVINCES as readonly string[]).includes(domisili)) {
    return { error: "Pilih provinsi asal." };
  }
  if (password !== confirmPassword) {
    return { error: "Password dan konfirmasi password tidak sama." };
  }
  const ktmErr = fileError(ktmFile ?? undefined, ALLOWED_KTM_EXT, "KTM");
  if (ktmErr) return { error: ktmErr };

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, university } },
  });

  if (error) return { error: error.message };
  if (!data.user || !data.session) {
    return {
      error:
        "Akun dibuat, tapi belum bisa login otomatis karena email confirmation masih aktif. Matikan \"Confirm email\" di Supabase (Authentication → Sign In / Providers → Email), lalu daftar ulang dengan email baru.",
    };
  }

  const ktmPath = `${data.user.id}/${Date.now()}-${safeName(ktmFile!.name)}`;
  const { error: uploadError } = await supabase.storage
    .from("ktm")
    .upload(ktmPath, ktmFile!, { contentType: ktmFile!.type });
  if (uploadError) return { error: `Gagal unggah KTM: ${uploadError.message}` };

  try {
    await prisma.profile.create({
      data: {
        id: data.user.id,
        fullName,
        university,
        domisili,
        ktmFilePath: ktmPath,
      },
    });
  } catch (e) {
    return {
      error: `Gagal menyimpan profil: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }

  redirect("/");
}

export async function signIn(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: "Email atau password salah." };

  const user = data.user;
  if (user) {
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    if (profile?.role === "od") redirect("/od");
  }
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Lupa password: buat token reset (valid 1 jam) untuk email yang terdaftar,
// lalu kirim link via email. Token dipakai sekali dan disimpan di tabel yang
// sama dengan token onboarding (PasswordSetToken).
export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Email tidak valid." };

  const admin = createAdminClient();
  const { data: usersData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const user = usersData.users.find((u) => u.email?.toLowerCase() === email);
  if (!user) return { error: "Email tidak terdaftar di sistem." };

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 jam

  try {
    // Hapus token reset lama yang belum dipakai untuk email ini, lalu buat baru.
    await prisma.passwordSetToken.deleteMany({
      where: { email, usedAt: null },
    });
    await prisma.passwordSetToken.create({
      data: { email, token, expiresAt },
    });
  } catch (e) {
    return {
      error: `Gagal membuat link reset: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { fullName: true },
  });
  const name =
    profile?.fullName ||
    (user.user_metadata?.full_name as string) ||
    email.split("@")[0];

  const sent = await sendPasswordResetEmail({ email, name, token });
  if (!sent.success) {
    return { error: "Gagal mengirim email. Coba lagi nanti." };
  }

  return { error: null as string | null };
}

// Tanggal laporan = hari weekdays terakhir pada bulan periode (bulan
// berakhir Sabtu/Minggu → mundur ke Jumat). Mis. Agustus 2026 → tgl 31 (Senin).
function lastWeekdayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 0); // hari terakhir bulan (month 1-based)
  if (d.getDay() === 0) d.setDate(d.getDate() - 2);
  else if (d.getDay() === 6) d.setDate(d.getDate() - 1);
  return d;
}

export async function submitLogbook(formData: FormData) {
  const { supabase, user } = await requireUserClient();

  const pembimbingId = String(formData.get("pembimbing_id") ?? "");
  const kadepId = String(formData.get("kadep_id") ?? "");
  const kadivId = String(formData.get("kadiv_id") ?? "");

  if (!pembimbingId || !kadepId || !kadivId) {
    return { error: "Pilih pembimbing, kepala departemen, dan kepala divisi." };
  }

  // Periode laporan (default bulan berjalan dari input type="month").
  const period = String(formData.get("period") ?? "").trim();
  let periodYear: number | null = null;
  let periodMonth: number | null = null;
  if (period) {
    const [y, m] = period.split("-").map((s) => Number(s));
    if (y >= 2000 && y <= 2100 && m >= 1 && m <= 12) {
      periodYear = y;
      periodMonth = m;
    }
  }
  if (periodYear === null || periodMonth === null) {
    return { error: "Pilih periode logbook." };
  }

  // Data cuti/izin (checkbox + jumlah hari + alasan).
  const hasCuti = formData.get("has_cuti") === "on";
  let cutiCount: number | null = null;
  let cutiReason: string | null = null;
  if (hasCuti) {
    const c = Number(formData.get("cuti_count") ?? "");
    if (!Number.isNaN(c) && c > 0) {
      cutiCount = Math.floor(c);
      cutiReason = String(formData.get("cuti_reason") ?? "").trim() || null;
    }
  }

  // Lepas draft dari submission yang ditolak supaya bisa di-resubmit.
  await prisma.dailyActivity.updateMany({
    where: {
      userId: user.id,
      submissionId: { not: null },
      submission: { status: "rejected" },
    },
    data: { submissionId: null },
  });

  // Tolak kalau periode ini sudah pernah dikirim dan belum ditolak.
  const existing = await prisma.logbookSubmission.findFirst({
    where: { userId: user.id, periodYear, periodMonth, status: { not: "rejected" } },
    select: { id: true },
  });
  if (existing) {
    return { error: "Logbook untuk periode ini sudah pernah dikirim." };
  }

  // Kegiatan harian diambil dari draft tersimpan di database.
  const periodPrefix = `${periodYear}-${String(periodMonth).padStart(2, "0")}`;
  const drafts = await prisma.dailyActivity.findMany({
    where: { userId: user.id, submissionId: null, tanggal: { startsWith: periodPrefix } },
    orderBy: { tanggal: "asc" },
  });
  if (drafts.length < 1 || drafts.length > 31) {
    return { error: "Simpan dulu kegiatan harian di halaman sebelumnya (minimal 1, maksimal 31 entri untuk periode ini)." };
  }
  const entries = drafts.map((d) => ({ tanggal: d.tanggal, kegiatan: d.kegiatan }));

  // Hari hadir = akumulasi baris kegiatan harian.
  const hadirCount = entries.length;

  let approvers: { id: string; name: string; email: string; role: string; divisi: string | null }[];
  try {
    approvers = await prisma.approver.findMany({
      where: { id: { in: [pembimbingId, kadepId, kadivId] } },
    });
  } catch (e) {
    return {
      error: `Gagal memuat data approver: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }
  if (approvers.length < 3) {
    return { error: "Data approver tidak lengkap. Coba pilih ulang." };
  }

  const byId = new Map(approvers.map((a) => [a.id, a]));
  const snapshot = (id: string) => {
    const a = byId.get(id);
    return a
      ? { name: a.name, email: a.email, divisi: a.divisi }
      : { name: null, email: null, divisi: null };
  };

  const pembimbing = snapshot(pembimbingId);
  const kadep = snapshot(kadepId);
  const kadiv = snapshot(kadivId);

  const profile = await prisma.profile.findUnique({ where: { id: user.id } });

  // ID dibuat di awal supaya URL verifikasi bisa dicetak sebagai QR di PDF.
  const submissionId = crypto.randomUUID();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const verificationUrl = appUrl ? `${appUrl}/verifikasi/${submissionId}` : undefined;

  // Generate PDF dari template dengan data form.
  const now = new Date();
  const genYear = periodYear ?? now.getFullYear();
  const genMonth = periodMonth ?? now.getMonth() + 1;
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generateLogbookPdf({
      profile: {
        fullName: profile?.fullName ?? null,
        university: profile?.university ?? null,
        posisi: profile?.posisi ?? null,
        nim: profile?.nim ?? null,
      },
      entries,
      periodYear: genYear,
      periodMonth: genMonth,
      pembimbing: pembimbing.name,
      kadep: kadep.name,
      kadiv: kadiv.name,
      kadepDepartemen: kadep.divisi,
      kadivDivisi: kadiv.divisi,
      verificationUrl,
    });
  } catch (e) {
    return {
      error: `Gagal membuat PDF: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }

  const filePath = `${user.id}/${Date.now()}-logbook.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("logbooks")
    .upload(filePath, pdfBuffer, { contentType: "application/pdf" });
  if (uploadError) return { error: `Gagal unggah logbook: ${uploadError.message}` };

  try {
    await prisma.logbookSubmission.create({
      data: {
        id: submissionId,
        userId: user.id,
        logbookFilePath: filePath,
        pembimbingId,
        kadepId,
        kadivId,
        pembimbingName: pembimbing.name,
        pembimbingEmail: pembimbing.email,
        kadepName: kadep.name,
        kadepEmail: kadep.email,
        kadivName: kadiv.name,
        kadivEmail: kadiv.email,
        periodYear,
        periodMonth,
        hadirCount,
        cutiCount,
        cutiReason,
        entries,
        status: "submitted",
      },
    });
  } catch (e) {
    return {
      error: `Gagal menyimpan laporan: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }

  // Tandai draft sudah masuk submission (riwayat mentahan tetap kekal).
  await prisma.dailyActivity.updateMany({
    where: { id: { in: drafts.map((d) => d.id) } },
    data: { submissionId },
  });

  // Email ke pembimbing dulu; kadep/kadiv dikirim otomatis saat TTD berjalan.
  const approvalToken = await createApprovalToken(
    submissionId,
    "pembimbing",
    pembimbing.name ?? "",
    pembimbing.email ?? ""
  );

  const namaPengaju =
    profile?.fullName ||
    (user.user_metadata?.full_name as string) ||
    user.email?.split("@")[0] ||
    "Mahasiswa";

  const tanggalLaporan = lastWeekdayOfMonth(genYear, genMonth);
  const namaFile = `Logbook ${namaPengaju} ${genYear}-${String(genMonth).padStart(2, "0")}.pdf`;

  await sendLogbookEmail(
    buildLogbookNotification({
      tahap: "pembimbing",
      emailTujuan: pembimbing.email ?? "",
      namaTujuan: pembimbing.name ?? "",
      emailPengaju: user.email ?? "",
      namaPengaju,
      namaPembimbing: pembimbing.name ?? undefined,
      universitas: profile?.university ?? undefined,
      posisi: profile?.posisi ?? undefined,
      domisili: profile?.domisili ?? undefined,
      namaFile,
      filePath,
      tanggal: tanggalLaporan,
      ctaUrl: buildTtdUrl(approvalToken.token),
    })
  );

  redirect("/done-submit");
}

// Tanggal hari ini (YYYY-MM-DD) zona Asia/Jakarta — patokan validasi
// "kegiatan tidak boleh diisi untuk tanggal yang belum lewat".
function jakartaToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

function validTanggal(tanggal: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(tanggal) && !Number.isNaN(new Date(`${tanggal}T00:00:00`).getTime());
}

export async function getDailyActivities() {
  const { user } = await requireUserClient();
  const activities = await prisma.dailyActivity.findMany({
    where: { userId: user.id, submissionId: null },
    orderBy: { tanggal: "asc" },
    select: { id: true, tanggal: true, kegiatan: true },
  });
  return { activities };
}

// Daftar tanggal hari libur (libur nasional + cuti bersama) untuk disable
// tanggal di date picker kegiatan harian.
export async function getHolidayDates() {
  await requireUser();
  const holidays = await prisma.holiday.findMany({
    where: { isLibur: true },
    select: { date: true },
  });
  return { dates: holidays.map((h) => h.date) };
}

export async function saveDailyActivities(formData: FormData) {
  const { user } = await requireUserClient();

  let raw: unknown = [];
  try {
    raw = JSON.parse(String(formData.get("entries") ?? "[]"));
  } catch {
    return { error: "Data kegiatan tidak valid." };
  }
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 31) {
    return { error: "Simpan minimal 1 dan maksimal 31 kegiatan sekaligus." };
  }

  const today = jakartaToday();
  const byTanggal = new Map<string, { tanggal: string; kegiatan: string }>();
  for (const item of raw) {
    const e = item as { tanggal?: unknown; kegiatan?: unknown };
    const tanggal = typeof e.tanggal === "string" ? e.tanggal : "";
    const kegiatan = typeof e.kegiatan === "string" ? e.kegiatan.trim() : "";
    if (!validTanggal(tanggal)) return { error: "Ada tanggal yang tidak valid." };
    if (tanggal > today) return { error: "Tidak bisa mengisi kegiatan untuk tanggal yang belum lewat." };
    if (!kegiatan) return { error: "Ada kegiatan yang kosong." };
    if (kegiatan.length > 500) return { error: "Kegiatan maksimal 500 karakter per entri." };
    byTanggal.set(tanggal, { tanggal, kegiatan });
  }
  const entries = [...byTanggal.values()];

  // Weekend dan hari libur tidak boleh diisi kegiatan.
  for (const e of entries) {
    const dow = new Date(`${e.tanggal}T00:00:00`).getDay();
    if (dow === 0 || dow === 6) {
      return { error: `${e.tanggal} jatuh di akhir pekan — hari libur tidak perlu diisi kegiatan.` };
    }
  }
  const libur = await prisma.holiday.findMany({
    where: { date: { in: entries.map((e) => e.tanggal) }, isLibur: true },
    select: { date: true },
  });
  if (libur.length > 0) {
    return { error: `${libur[0].date} hari libur — tidak perlu diisi kegiatan.` };
  }

  const dates = entries.map((e) => e.tanggal);
  const locked = await prisma.dailyActivity.findMany({
    where: { userId: user.id, tanggal: { in: dates }, submissionId: { not: null } },
    select: { tanggal: true },
  });
  if (locked.length > 0) {
    return { error: `Kegiatan tanggal ${locked[0].tanggal} sudah masuk logbook yang dikirim dan tidak bisa diubah.` };
  }

  try {
    await prisma.$transaction(
      entries.map((e) =>
        prisma.dailyActivity.upsert({
          where: { userId_tanggal: { userId: user.id, tanggal: e.tanggal } },
          create: { userId: user.id, tanggal: e.tanggal, kegiatan: e.kegiatan },
          update: { kegiatan: e.kegiatan },
        })
      )
    );
  } catch (e) {
    return { error: `Gagal menyimpan kegiatan: ${e instanceof Error ? e.message : "unknown"}` };
  }

  return { error: null as string | null };
}

export async function deleteDailyActivity(formData: FormData) {
  const { user } = await requireUserClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ID kegiatan tidak valid." };

  const existing = await prisma.dailyActivity.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return { error: "Kegiatan tidak ditemukan." };
  }
  if (existing.submissionId) {
    return { error: "Kegiatan ini sudah masuk logbook yang dikirim." };
  }

  await prisma.dailyActivity.delete({ where: { id } });
  return { error: null as string | null };
}

export async function updateProfile(formData: FormData) {
  const { user } = await requireUserClient();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const university = String(formData.get("university") ?? "").trim();
  const domisili = String(formData.get("domisili") ?? "").trim();
  const posisi = String(formData.get("posisi") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const emailNotif = formData.get("email_notif") === "on";

  if (!fullName) return { error: "Nama tidak boleh kosong." };
  if (!domisili || !(PROVINCES as readonly string[]).includes(domisili)) {
    return { error: "Pilih provinsi asal." };
  }

  try {
    await prisma.profile.update({
      where: { id: user.id },
      data: {
        fullName,
        university: university || null,
        domisili,
        posisi: posisi || null,
        phone: phone || null,
        emailNotif,
      },
    });
  } catch (e) {
    return {
      error: `Gagal menyimpan profil: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }
  redirect("/settings");
}

export async function getApprovers() {
  await requireUser();
  const approvers = await prisma.approver.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true },
  });
  return { approvers };
}

export async function uploadAvatar(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const { supabase, user } = await requireUserClient();
  const file = formData.get("avatar_file") as File | null;

  const err = fileError(file ?? undefined, ALLOWED_AVATAR_EXT, "Foto profil");
  if (err) return { error: err };

  const path = `${user.id}/avatar-${Date.now()}-${safeName(file!.name)}`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file!, { contentType: file!.type });
  if (uploadError) return { error: `Gagal unggah foto: ${uploadError.message}` };

  try {
    await prisma.profile.update({
      where: { id: user.id },
      data: { avatarPath: path },
    });
  } catch (e) {
    return {
      error: `Gagal menyimpan foto: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }

  redirect("/settings");
}

export async function removeAvatar() {
  const { supabase, user } = await requireUserClient();
  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  if (profile?.avatarPath) {
    await supabase.storage.from("avatars").remove([profile.avatarPath]);
  }
  await prisma.profile.update({
    where: { id: user.id },
    data: { avatarPath: null },
  });
  redirect("/settings");
}

// E-sign lazy: kalau submission sudah kadiv_approved tapi salinan bertanda
// tangan belum ada, generate dulu baru kasih URL (sekali saja — path
// tersimpan di DB).
async function ensureSignedUrlPath(submissionId: string) {
  const s = await prisma.logbookSubmission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      userId: true,
      logbookFilePath: true,
      status: true,
      pembimbingName: true,
      kadepName: true,
      kadivName: true,
      signedFilePath: true,
    },
  });
  if (!s) return null;
  if (s.signedFilePath) return s.signedFilePath;
  const { generateSignedPdf } = await import("@/lib/sign");
  return generateSignedPdf(s);
}

export async function downloadFile(
  path: string,
  bucket: "logbooks" | "ktm",
  submissionId?: string
) {
  await requireOD();
  let target = path;
  if (submissionId) {
    const signed = await ensureSignedUrlPath(submissionId);
    if (signed) target = signed;
  }
  const supabase = await createClient();
  const { data } = await supabase.storage.from(bucket).createSignedUrl(target, 300);
  return { url: data?.signedUrl ?? null };
}

export async function downloadOwnFile(
  path: string,
  bucket: "logbooks" | "ktm",
  submissionId?: string
) {
  const { supabase, user } = await requireUserClient();
  if (!path.startsWith(`${user.id}/`)) return { url: null, error: "Tidak diizinkan." };
  let target = path;
  if (submissionId) {
    const s = await prisma.logbookSubmission.findUnique({
      where: { id: submissionId },
      select: { userId: true },
    });
    if (s?.userId !== user.id) return { url: null, error: "Tidak diizinkan." };
    const signed = await ensureSignedUrlPath(submissionId);
    if (signed) target = signed;
  }
  const { data } = await supabase.storage.from(bucket).createSignedUrl(target, 300);
  return { url: data?.signedUrl ?? null, error: null };
}

export async function updateIntern(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  await requireOD();
  const id = String(formData.get("id") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const domisili = String(formData.get("domisili") ?? "").trim();
  const university = String(formData.get("university") ?? "").trim();
  const posisi = String(formData.get("posisi") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "").trim();
  const endDate = String(formData.get("end_date") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!id) return { error: "Data anak magang tidak ditemukan." };
  if (!fullName) return { error: "Nama tidak boleh kosong." };
  if (domisili && !(PROVINCES as readonly string[]).includes(domisili)) {
    return { error: "Pilih provinsi asal yang valid." };
  }

  try {
    await prisma.profile.update({
      where: { id },
      data: {
        fullName,
        domisili: domisili || null,
        university: university || null,
        posisi: posisi || null,
        startDate: startDate || null,
        endDate: endDate || null,
        phone: phone || null,
      },
    });
  } catch (e) {
    return {
      error: `Gagal menyimpan data: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }

  revalidatePath("/od/list-anak");
  return { error: null };
}

export async function deleteIntern(formData: FormData) {
  await requireOD();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Data anak magang tidak ditemukan." };

  // Best-effort hapus file storage milik akun tersebut.
  const supabase = await createClient();
  for (const bucket of ["ktm", "logbooks", "avatars"] as const) {
    const { data: files } = await supabase.storage.from(bucket).list(id);
    if (files && files.length > 0) {
      await supabase.storage
        .from(bucket)
        .remove(files.map((f) => `${id}/${f.name}`));
    }
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) return { error: `Gagal menghapus akun: ${error.message}` };
  } else {
    // Tanpa service role key, fallback hapus baris profil saja.
    try {
      await prisma.profile.delete({ where: { id } });
    } catch (e) {
      return {
        error: `Gagal menghapus data: ${e instanceof Error ? e.message : "unknown"}`,
      };
    }
  }

  revalidatePath("/od/list-anak");
  return { error: null };
}

export async function deleteSubmission(formData: FormData) {
  await requireOD();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Submission tidak ditemukan." };

  const submission = await prisma.logbookSubmission.findUnique({
    where: { id },
    select: { logbookFilePath: true, signedFilePath: true },
  });
  if (!submission) return { error: "Submission tidak ditemukan." };

  const supabase = await createClient();
  const filesToDelete: string[] = [submission.logbookFilePath];
  if (submission.signedFilePath) filesToDelete.push(submission.signedFilePath);

  await supabase.storage.from("logbooks").remove(filesToDelete);

  try {
    await prisma.logbookSubmission.delete({ where: { id } });
  } catch (e) {
    return {
      error: `Gagal menghapus submission: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }

  revalidatePath("/od/history");
  return { error: null };
}

// OD: koreksi jumlah kehadiran (total hari masuk & cuti/izin) pada submission.
export async function updateSubmission(formData: FormData) {
  await requireOD();
  const id = String(formData.get("id") ?? "");
  const hadirCount = Number(formData.get("hadir_count") ?? "");
  const cutiCount = Number(formData.get("cuti_count") ?? "");
  if (!id) return { error: "Submission tidak ditemukan." };
  if (!Number.isInteger(hadirCount) || hadirCount < 0) {
    return { error: "Total hari masuk tidak valid." };
  }
  if (!Number.isInteger(cutiCount) || cutiCount < 0) {
    return { error: "Total hari cuti tidak valid." };
  }

  try {
    await prisma.logbookSubmission.update({
      where: { id },
      data: { hadirCount, cutiCount },
    });
  } catch (e) {
    return {
      error: `Gagal memperbarui data: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }

  revalidatePath("/od/history");
  return { error: null };
}

// Hapus undangan anak magang yang belum set password (baris token saja,
// belum ada akun/profile jadi tidak perlu bersih-bersih storage/auth).
export async function deletePendingIntern(formData: FormData) {
  await requireOD();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Undangan tidak ditemukan." };

  try {
    await prisma.passwordSetToken.delete({ where: { id } });
  } catch (e) {
    return {
      error: `Gagal menghapus undangan: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }
  return { error: null };
}

export async function markPaid(formData: FormData) {
  await requireOD();
  const ids = String(formData.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (ids.length === 0) return { error: "Pilih minimal satu laporan." };

  try {
    const setting = await prisma.appSetting.findUnique({ where: { id: 1 } });
    const rate = setting?.salaryPerDay ?? 100000;

    const rows = await prisma.logbookSubmission.findMany({
      where: { id: { in: ids } },
      select: { id: true, hadirCount: true },
    });

    await prisma.$transaction(
      rows.map((r) =>
        prisma.logbookSubmission.update({
          where: { id: r.id },
          data: {
            paymentStatus: "paid",
            paymentAmount: (r.hadirCount ?? 0) * rate,
            paidAt: new Date(),
          },
        })
      )
    );
  } catch (e) {
    return {
      error: `Gagal memperbarui status: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }
  revalidatePath("/od/history");
  return { error: null };
}

const APPROVER_ROLES = ["pembimbing", "kadep", "kadiv"] as const;

export async function saveApprover(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  await requireOD();
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const divisi = String(formData.get("divisi") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();

  if (!name) return { error: "Nama tidak boleh kosong." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Email tidak valid." };
  if (!(APPROVER_ROLES as readonly string[]).includes(role)) {
    return { error: "Role tidak valid." };
  }

  const duplicate = await prisma.approver.findFirst({
    where: { email, ...(id ? { id: { not: id } } : {}) },
    select: { id: true },
  });
  if (duplicate) return { error: "Email sudah dipakai approver lain." };

  try {
    if (id) {
      await prisma.approver.update({
        where: { id },
        data: { name, email, divisi: divisi || null, role },
      });
    } else {
      await prisma.approver.create({
        data: { name, email, divisi: divisi || null, role },
      });
    }
  } catch (e) {
    return {
      error: `Gagal menyimpan data: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }

  revalidatePath("/od/approvers");
  return { error: null };
}

export async function deleteApprover(formData: FormData) {
  await requireOD();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Data approver tidak ditemukan." };

  try {
    await prisma.approver.delete({ where: { id } });
  } catch (e) {
    return {
      error: `Gagal menghapus data: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }

  revalidatePath("/od/approvers");
  return { error: null };
}

const HOLIDAY_TYPES = ["libur_nasional", "cuti_bersama"] as const;

export async function saveHoliday(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  await requireOD();
  const originalDate = String(formData.get("original_date") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const isLibur = formData.get("is_libur") === "on";

  if (!name) return { error: "Nama hari libur tidak boleh kosong." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Tanggal tidak valid." };
  if (!(HOLIDAY_TYPES as readonly string[]).includes(type)) {
    return { error: "Tipe tidak valid." };
  }

  // Sabtu/Minggu pasti libur — tidak perlu didaftar manual.
  const [y, m, d] = date.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  if (dow === 0 || dow === 6) {
    return { error: "Tanggal jatuh di akhir pekan (Sabtu/Minggu) — tidak perlu ditambahkan." };
  }

  const duplicate = await prisma.holiday.findUnique({ where: { date } });
  if (duplicate && duplicate.date !== originalDate) {
    return { error: "Tanggal itu sudah terdaftar sebagai hari libur." };
  }

  try {
    if (originalDate && originalDate !== date) {
      await prisma.holiday.delete({ where: { date: originalDate } });
    }
    await prisma.holiday.upsert({
      where: { date },
      update: { name, type, isLibur: type === "libur_nasional" ? true : isLibur },
      create: { date, name, type, isLibur: type === "libur_nasional" ? true : isLibur, year: y },
    });
  } catch (e) {
    return {
      error: `Gagal menyimpan hari libur: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }

  clearWorkdayCache();
  revalidatePath("/od/hari-libur");
  revalidatePath("/");
  return { error: null };
}

export async function deleteHoliday(formData: FormData) {
  await requireOD();
  const date = String(formData.get("date") ?? "");
  if (!date) return { error: "Hari libur tidak ditemukan." };

  try {
    await prisma.holiday.delete({ where: { date } });
  } catch (e) {
    return {
      error: `Gagal menghapus hari libur: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }

  clearWorkdayCache();
  revalidatePath("/od/hari-libur");
  revalidatePath("/");
  return { error: null };
}

export async function updateSalaryPerDay(formData: FormData) {
  await requireOD();
  const value = Number(formData.get("salaryPerDay") ?? "");
  if (!Number.isInteger(value) || value <= 0) {
    return { error: "Nominal gaji per hari tidak valid." };
  }

  try {
    await prisma.appSetting.upsert({
      where: { id: 1 },
      update: { salaryPerDay: value },
      create: { id: 1, salaryPerDay: value },
    });
  } catch (e) {
    return {
      error: `Gagal menyimpan pengaturan: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }
  revalidatePath("/od/settings");
  return { error: null };
}

