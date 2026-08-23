import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";

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

    // 1. Find valid token
    const tokenData = await prisma.passwordSetToken.findUnique({
      where: { token },
    });

    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: "Token tidak valid" },
        { status: 400 }
      );
    }

    // 2. Check if token is already used
    if (tokenData.usedAt) {
      return NextResponse.json(
        { success: false, error: "Token sudah digunakan" },
        { status: 400 }
      );
    }

    // 3. Check if token is expired
    if (new Date(tokenData.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: "Token telah kadaluarsa" },
        { status: 400 }
      );
    }

    // 4. Check if user already exists (by email)
    const admin = createAdminClient();

    // First, let's check if a user with this email already exists
    const { data: existingUsers } = await admin.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(
      (u) => u.email === tokenData.email
    );

    let userId: string;

    if (existingUser) {
      // User exists, update their password
      await admin.auth.admin.updateUserById(existingUser.id, {
        password,
      });
      userId = existingUser.id;
    } else {
      // Create new user
      const { data: newUser, error: createError } =
        await admin.auth.admin.createUser({
          email: tokenData.email,
          password,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            full_name: tokenData.name || "",
            university: tokenData.university || "",
            posisi: tokenData.posisi || "",
            domisili: tokenData.domisili || "",
            phone: tokenData.phone || "",
          },
        });

      if (createError || !newUser) {
        return NextResponse.json(
          { success: false, error: "Gagal membuat user: " + (createError?.message || "Unknown error") },
          { status: 500 }
        );
      }

      userId = newUser.user.id;
    }

    // 5. Create or update profile (bawa semua field dari token)
    await prisma.profile.upsert({
      where: { id: userId },
      create: {
        id: userId,
        fullName: tokenData.name || "",
        email: tokenData.email,
        university: tokenData.university || null,
        posisi: tokenData.posisi || null,
        domisili: tokenData.domisili || null,
        startDate: tokenData.startDate || null,
        endDate: tokenData.endDate || null,
        phone: tokenData.phone || null,
        role: "mahasiswa",
      },
      update: {
        fullName: tokenData.name || "",
        email: tokenData.email,
        university: tokenData.university || null,
        posisi: tokenData.posisi || null,
        domisili: tokenData.domisili || null,
        startDate: tokenData.startDate || null,
        endDate: tokenData.endDate || null,
        phone: tokenData.phone || null,
      },
    });

    // 6. Mark token as used
    await prisma.passwordSetToken.update({
      where: { token },
      data: { usedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "Password berhasil di-set",
    });
  } catch (error) {
    console.error("Error setting password:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Terjadi kesalahan",
      },
      { status: 500 }
    );
  }
}
