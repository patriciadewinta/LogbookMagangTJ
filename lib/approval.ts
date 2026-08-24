import crypto from "crypto";
import type { LogbookSubmission } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildLogbookNotification, sendLogbookEmail } from "@/lib/notify";

export type Tahap = "pembimbing" | "kadep" | "kadiv";

// Status submission SETELAH tahap ini ditandatangani.
export const TAHAP_ORDER: Record<Tahap, string> = {
  pembimbing: "pembimbing_approved",
  kadep: "kadep_approved",
  kadiv: "kadiv_approved",
};

// Status submission SEBELUM tahap ini boleh ditandatangani.
export const STATUS_BEFORE: Record<Tahap, string> = {
  pembimbing: "submitted",
  kadep: "pembimbing_approved",
  kadiv: "kadep_approved",
};

export const TAHAP_LABEL: Record<Tahap, string> = {
  pembimbing: "Pembimbing",
  kadep: "Kepala Departemen",
  kadiv: "Kepala Divisi",
};

const NEXT_TAHAP: Partial<Record<Tahap, Tahap>> = {
  pembimbing: "kadep",
  kadep: "kadiv",
};

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function isTahap(value: string): value is Tahap {
  return value === "pembimbing" || value === "kadep" || value === "kadiv";
}

export function approverOf(submission: LogbookSubmission, tahap: Tahap) {
  switch (tahap) {
    case "pembimbing":
      return { name: submission.pembimbingName, email: submission.pembimbingEmail };
    case "kadep":
      return { name: submission.kadepName, email: submission.kadepEmail };
    case "kadiv":
      return { name: submission.kadivName, email: submission.kadivEmail };
  }
}

export async function createApprovalToken(
  submissionId: string,
  tahap: Tahap,
  approverName: string,
  approverEmail: string
) {
  const token = crypto.randomBytes(32).toString("base64url");
  return prisma.approvalToken.create({
    data: {
      submissionId,
      tahap,
      approverName,
      approverEmail,
      token,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });
}

export function buildTtdUrl(token: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}/ttd?token=${token}`;
}

// Approver tidak punya login — signed URL dibuat lewat service role.
export async function getSubmissionPdfSignedUrl(
  filePath: string,
  seconds = 600
): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("logbooks")
    .createSignedUrl(filePath, seconds);
  if (error || !data?.signedUrl) {
    throw error ?? new Error("Gagal membuat signed URL untuk file logbook");
  }
  return data.signedUrl;
}

// Tanggal laporan = hari weekdays terakhir pada bulan periode
// (duplikat kecil dari app/actions.ts — sama dengan yang dipakai submit).
function lastWeekdayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 0);
  if (d.getDay() === 0) d.setDate(d.getDate() - 2);
  else if (d.getDay() === 6) d.setDate(d.getDate() - 1);
  return d;
}

async function sendTahapEmail(
  submission: LogbookSubmission,
  tahap: Tahap,
  ctaUrl: string
) {
  const profile = await prisma.profile.findUnique({
    where: { id: submission.userId },
  });
  const namaPengaju = profile?.fullName || profile?.email || "Mahasiswa";
  const namaFile =
    submission.logbookFilePath.split("/").pop() ?? submission.logbookFilePath;
  const tanggal = lastWeekdayOfMonth(
    submission.periodYear ?? new Date().getFullYear(),
    submission.periodMonth ?? new Date().getMonth() + 1
  );

  const tujuan = approverOf(submission, tahap);
  return sendLogbookEmail(
    buildLogbookNotification({
      tahap,
      emailTujuan: tujuan.email ?? "",
      namaTujuan: tujuan.name ?? "",
      emailPengaju: profile?.email ?? "",
      namaPengaju,
      namaPembimbing: submission.pembimbingName ?? undefined,
      namaKadep: submission.kadepName ?? undefined,
      universitas: profile?.university ?? undefined,
      posisi: profile?.posisi ?? undefined,
      domisili: profile?.domisili ?? undefined,
      namaFile,
      filePath: submission.logbookFilePath,
      tanggal,
      ctaUrl,
    })
  );
}

// Advance status setelah `approvedTahap` ditandatangani. Jika approver tahap
// berikutnya orang yang sama (email sama), tahap itu di-auto-advance tanpa
// email; email hanya dikirim saat penerima benar-benar berubah.
export async function advanceApproval(
  submission: LogbookSubmission,
  approvedTahap: Tahap
): Promise<{ finished: boolean; nextTahap?: Tahap; nextApproverName?: string }> {
  const approvedEmail = approverOf(submission, approvedTahap)?.email
    ?.trim()
    .toLowerCase();

  let finalTahap = approvedTahap;
  let next = NEXT_TAHAP[approvedTahap];
  while (next) {
    const nextEmail = approverOf(submission, next)?.email?.trim().toLowerCase();
    if (nextEmail && approvedEmail && nextEmail === approvedEmail) {
      finalTahap = next;
      next = NEXT_TAHAP[next];
      continue;
    }
    break;
  }

  await prisma.logbookSubmission.update({
    where: { id: submission.id },
    data: { status: TAHAP_ORDER[finalTahap] },
  });

  const nextTahap = NEXT_TAHAP[finalTahap];
  if (!nextTahap) return { finished: true };

  const tujuan = approverOf(submission, nextTahap);
  if (!tujuan.email) {
    console.error(`Email approver tahap ${nextTahap} kosong — email tidak terkirim.`);
    return { finished: false, nextTahap };
  }

  const token = await createApprovalToken(
    submission.id,
    nextTahap,
    tujuan.name ?? "",
    tujuan.email
  );
  await sendTahapEmail(submission, nextTahap, buildTtdUrl(token.token));

  return { finished: false, nextTahap, nextApproverName: tujuan.name ?? undefined };
}
