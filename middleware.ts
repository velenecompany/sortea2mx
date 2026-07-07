import { NextRequest, NextResponse } from "next/server";
import { isValidSessionToken } from "./lib/session";
import { verifyUserToken } from "./lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Tu acceso (PIN de /ceo) — sin cambios.
  if (pathname.startsWith("/ceo/dashboard") || pathname.startsWith("/api/raffle/admin")) {
    const token = req.cookies.get("ceo_session")?.value;
    const authed = await isValidSessionToken(token);
    if (!authed) {
      if (pathname.startsWith("/api/raffle/admin")) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/ceo", req.url));
    }
    return NextResponse.next();
  }

  // Cuentas de usuario normales (independientes del PIN).
  if (pathname.startsWith("/my") || pathname.startsWith("/api/my-raffle/admin")) {
    const token = req.cookies.get("user_session")?.value;
    const userId = await verifyUserToken(token);
    if (!userId) {
      if (pathname.startsWith("/api/my-raffle/admin")) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/ceo/dashboard/:path*",
    "/api/raffle/admin/:path*",
    "/my/:path*",
    "/api/my-raffle/admin/:path*",
  ],
};
