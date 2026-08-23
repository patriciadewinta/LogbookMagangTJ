import { NextRequest, NextResponse } from "next/server";
import { requireOD } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPasswordSetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  // Verify OD permission
  await requireOD();

  try {
    const {
      email,
      name,
      university,
      posisi,
      domisili,
      startDate,
      endDate,
      phone,
    } = await request.json();

    // Validate input
    if (!email || !name) {
      return NextResponse.json(
        { success: false, error: "Email dan nama wajib diisi" },
        { status: 400 }
      );
    }

    // Check if there's a pending token for this email
    const existingToken = await prisma.passwordSetToken.findFirst({
      where: {
        email,
        usedAt: null,
        expiresAt: { gte: new Date() },
      },
    });

    if (existingToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Email ini sudah mempunyai token aktif. Cek inbox anak magang.",
        },
        { status: 400 }
      );
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");

    // Set expiry to 7 days from now
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Create password set token record
    await prisma.passwordSetToken.create({
      data: {
        email,
        token,
        name,
        university: university || null,
        posisi: posisi || null,
        domisili: domisili || null,
        startDate: startDate || null,
        endDate: endDate || null,
        phone: phone || null,
        expiresAt,
      },
    });

    // Send email via Resend
    const emailResult = await sendPasswordSetEmail({
      email,
      name,
      token,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Gagal mengirim email. Silakan coba lagi.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Anak magang ditambahkan. Email telah dikirim.",
    });
  } catch (error) {
    console.error("Error adding intern:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Terjadi kesalahan",
      },
      { status: 500 }
    );
  }
}
