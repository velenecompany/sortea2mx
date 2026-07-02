import { NextRequest, NextResponse } from "next/server";
import { isValidSessionToken } from "./lib/session";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("ceo_session")?.value;
  const authed = await isValidSessionToken(token);

  if (!authed) {
    if (req.nextUrl.pathname.startsWith("/api/raffle/admin")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/ceo", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/ceo/dashboard/:path*", "/api/raffle/admin/:path*"],
};
