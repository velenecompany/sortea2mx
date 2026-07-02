import { NextRequest, NextResponse } from "next/server";
import { getState, joinEntry } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await getState();
    return NextResponse.json(state);
  } catch (err) {
    console.error("Error en GET /api/raffle:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
    }
    if (name.trim().length > 40) {
      return NextResponse.json({ error: "Nombre muy largo" }, { status: 400 });
    }

    const state = await joinEntry(name);
    return NextResponse.json(state);
  } catch (err) {
    console.error("Error en POST /api/raffle:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
