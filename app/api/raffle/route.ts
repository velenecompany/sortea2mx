import { NextRequest, NextResponse } from "next/server";
import { getState, joinEntry } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = await getState();
  return NextResponse.json(state);
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
  }
  if (name.trim().length > 40) {
    return NextResponse.json({ error: "Nombre muy largo" }, { status: 400 });
  }

  const state = await joinEntry(name);
  return NextResponse.json(state);
}
