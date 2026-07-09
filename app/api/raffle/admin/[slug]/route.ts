import { NextRequest, NextResponse } from "next/server";
import {
  deleteRaffle,
  importInstagram,
  removeEntry,
  reopenForRedraw,
  resetRaffle,
  saveConfig,
  setForcedWinner,
} from "@/lib/store";

// Protegida por middleware.ts (matcher /api/raffle/admin/:path*).
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const body = await req.json();
    const { action } = body;
    const slug = params.slug;

    switch (action) {
      case "saveConfig": {
        const state = await saveConfig(slug, body.config);
        return NextResponse.json(state);
      }
      case "importInstagram": {
        const names: string[] = (body.names || "")
          .split("\n")
          .map((s: string) => s.trim())
          .filter(Boolean);
        const state = await importInstagram(slug, names);
        return NextResponse.json(state);
      }
      case "removeEntry": {
        const state = await removeEntry(slug, body.id);
        return NextResponse.json(state);
      }
      case "setForcedWinner": {
        const state = await setForcedWinner(slug, body.entryId || null);
        return NextResponse.json(state);
      }
      case "reset": {
        const state = await resetRaffle(slug);
        return NextResponse.json(state);
      }
      case "reopenDraw": {
        const state = await reopenForRedraw(slug);
        return NextResponse.json(state);
      }
      case "delete": {
        await deleteRaffle(slug);
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
    }
  } catch (err) {
    console.error("Error en POST /api/raffle/admin/[slug]:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
