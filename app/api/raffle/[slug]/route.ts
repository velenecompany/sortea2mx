import { NextRequest, NextResponse } from "next/server";
import { getState, joinEntry } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const state = await getState(params.slug);
    if (!state) {
      return NextResponse.json({ error: "Sorteo no encontrado" }, { status: 404 });
    }
    return NextResponse.json(state);
  } catch (err) {
    console.error("Error en GET /api/raffle/[slug]:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { name } = await req.json();

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
    }
    if (name.trim().length > 40) {
      return NextResponse.json({ error: "Nombre muy largo" }, { status: 400 });
    }

    const state = await joinEntry(params.slug, name);
    if (!state) {
      return NextResponse.json({ error: "Sorteo no encontrado" }, { status: 404 });
    }
    return NextResponse.json(state);
  } catch (err) {
    console.error("Error en POST /api/raffle/[slug]:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
