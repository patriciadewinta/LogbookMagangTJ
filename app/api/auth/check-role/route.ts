import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getProfileForUser } from "@/lib/profile";

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const profile = await getProfileForUser(user.id);

    return NextResponse.json({
      authenticated: true,
      role: profile?.role || null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to check role" },
      { status: 500 }
    );
  }
}
