import { NextRequest, NextResponse } from "next/server";
import { createSessionToken } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { pin } = await req.json();
  const validPin = process.env.CEO_PIN;

  if (!validPin) {
    return NextResponse.json(
      { error: "CEO_PIN no está configurado en el servidor" },
      { status: 500 }
    );
  }

  if (pin !== validPin) {
    return NextResponse.json({ error: "Pin incorrecto" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("ceo_session", await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas
  });
  return res;
}
