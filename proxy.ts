import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const PROTECTED_PATHS = ["/", "/history", "/settings", "/input-logbook", "/done-submit"];
const AUTH_PATHS = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Verifikasi JWT lokal via JWKS cache — tanpa round-trip ke server Auth.
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData && "claims" in claimsData ? claimsData.claims : null;

  const { pathname } = request.nextUrl;

  // User sudah login, jangan tampilkan halaman login/register.
  if (user && AUTH_PATHS.includes(pathname)) {
    const profile = await prisma.profile.findUnique({ where: { id: user.sub } });
    const dest = profile?.role === "od" ? "/od" : "/";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Belum login, arahkan ke login.
  if (
    !user &&
    (PROTECTED_PATHS.includes(pathname) || pathname.startsWith("/od"))
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
