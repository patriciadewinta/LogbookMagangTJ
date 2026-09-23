import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAdminClient, findAuthUserByEmail } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token tidak ditemukan" },
        { status: 400 }
      );
    }

    const tokenData = await prisma.passwordSetToken.findUnique({
      where: { token },
    });

    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: "Token tidak valid" },
        { status: 400 }
      );
    }

    if (tokenData.usedAt) {
      return NextResponse.json(
        { success: false, error: "Token sudah digunakan" },
        { status: 400 }
      );
    }

    if (new Date(tokenData.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: "Token telah kadaluarsa" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error checking reset token:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Terjadi kesalahan",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: "Token dan password wajib diisi" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    const tokenData = await prisma.passwordSetToken.findUnique({
      where: { token },
    });

    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: "Token tidak valid" },
        { status: 400 }
      );
    }

    if (tokenData.usedAt) {
      return NextResponse.json(
        { success: false, error: "Token sudah digunakan" },
        { status: 400 }
      );
    }

    if (new Date(tokenData.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: "Token telah kadaluarsa" },
        { status: 400 }
      );
    }

    // Reset hanya untuk akun yang sudah terdaftar — cari user by email.
    const user = await findAuthUserByEmail(tokenData.email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Email tidak terdaftar" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    await admin.auth.admin.updateUserById(user.id, { password });

    await prisma.passwordSetToken.update({
      where: { token },
      data: { usedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "Password berhasil diubah",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Terjadi kesalahan",
      },
      { status: 500 }
    );
  }
}
