import { NextResponse } from "next/server";
import { listRaffles } from "@/lib/store";

export const dynamic = "force-dynamic";

// Pública: lista todos los sorteos, para la portada.
export async function GET() {
  try {
    const raffles = await listRaffles();
    return NextResponse.json({ raffles });
  } catch (err) {
    console.error("Error en GET /api/raffles:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
