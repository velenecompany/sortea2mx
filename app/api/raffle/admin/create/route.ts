import { NextRequest, NextResponse } from "next/server";
import { createRaffle } from "@/lib/store";

// Protegida por middleware.ts (matcher /api/raffle/admin/:path*).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = (body.title || "").trim();
    const prize = (body.prize || "").trim();
    const description = (body.description || "").trim();
    const mode = body.mode === "instagram" ? "instagram" : "directo";

    if (!title) {
      return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
    }

    const config = await createRaffle({
      title,
      prize: prize || "Premio sorpresa",
      description: description || "Un boleto, una oportunidad.",
      mode,
    });

    return NextResponse.json(config);
  } catch (err) {
    console.error("Error en POST /api/raffle/admin/create:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
