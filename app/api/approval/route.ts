import { NextRequest, NextResponse } from "next/server";
import type { ApprovalToken, LogbookSubmission } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  advanceApproval,
  approverOf,
  getSubmissionPdfSignedUrl,
  isTahap,
  STATUS_BEFORE,
  TAHAP_LABEL,
} from "@/lib/approval";

function invalid(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

type LoadResult =
  | { error: string; record?: undefined }
  | { error?: undefined; record: ApprovalToken & { submission: LogbookSubmission } };

async function loadValidToken(token: string | null): Promise<LoadResult> {
  if (!token) return { error: "Token tidak ditemukan." };

  const record = await prisma.approvalToken.findUnique({
    where: { token },
    include: { submission: true },
  });
  if (!record) return { error: "Link tidak valid." };
  if (record.usedAt) return { error: "Link ini sudah pernah digunakan." };
  if (new Date(record.expiresAt) < new Date()) {
    return { error: "Link telah kedaluwarsa. Minta anak magang mengirim ulang logbook." };
  }
  if (!isTahap(record.tahap)) return { error: "Tahap tidak valid." };
  if (record.submission.status !== STATUS_BEFORE[record.tahap]) {
    return { error: "Tahap ini sudah ditandatangani." };
  }
  return { record };
}

export async function GET(request: NextRequest) {
  try {
    const result = await loadValidToken(request.nextUrl.searchParams.get("token"));
    if (!result.record) return invalid(result.error ?? "Link tidak valid.");

    const { record } = result;
    const tahap = record.tahap;
    if (!isTahap(tahap)) return invalid("Tahap tidak valid.");

    const submission = record.submission;
    const profile = await prisma.profile.findUnique({
      where: { id: submission.userId },
    });
    const pdfUrl = await getSubmissionPdfSignedUrl(submission.logbookFilePath);

    return NextResponse.json({
      success: true,
      tahap,
      tahapLabel: TAHAP_LABEL[tahap],
      approverName: record.approverName,
      namaPengaju: profile?.fullName || profile?.email || "Mahasiswa",
      universitas: profile?.university ?? "",
      posisi: profile?.posisi ?? "",
      domisili: profile?.domisili ?? "",
      namaFile: submission.logbookFilePath.split("/").pop() ?? "",
      periode: submission.periodYear && submission.periodMonth
        ? `${submission.periodMonth}/${submission.periodYear}`
        : "",
      pdfUrl,
    });
  } catch (error) {
    console.error("Error approval GET:", error);
    return invalid("Terjadi kesalahan saat memuat data.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token) return invalid("Token tidak ditemukan.");

    const result = await loadValidToken(token);
    if (!result.record) return invalid(result.error ?? "Link tidak valid.");

    const { record } = result;
    const tahap = record.tahap;
    if (!isTahap(tahap)) return invalid("Tahap tidak valid.");

    // Atomic claim: klik/dobel-klik konkuren hanya satu yang menang.
    const claim = await prisma.approvalToken.updateMany({
      where: { token, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (claim.count === 0) {
      return invalid("Link ini sudah diproses.", 409);
    }

    const advance = await advanceApproval(record.submission, tahap);

    const nextTujuan = advance.nextTahap
      ? approverOf(record.submission, advance.nextTahap)
      : null;

    return NextResponse.json({
      success: true,
      tahapLabel: TAHAP_LABEL[tahap],
      finished: advance.finished,
      nextTahapLabel: advance.nextTahap ? TAHAP_LABEL[advance.nextTahap] : null,
      nextApproverName: nextTujuan?.name ?? null,
    });
  } catch (error) {
    console.error("Error approval POST:", error);
    return invalid("Terjadi kesalahan saat memproses tanda tangan.", 500);
  }
}
