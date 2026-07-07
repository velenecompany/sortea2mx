import { NextRequest, NextResponse } from "next/server";
import { drawWinner } from "@/lib/store";

export const dynamic = "force-dynamic";

// Pública a propósito: cualquiera puede disparar el sorteo. Lo que decide
// el resultado sigue siendo privado (forcedWinnerId, fijado solo desde /ceo).
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { state, winner } = await drawWinner(params.slug);
    if (!state) {
      return NextResponse.json({ error: "Sorteo no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ...state, winner });
  } catch (err) {
    console.error("Error en POST /api/raffle/[slug]/draw:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
