import { NextRequest, NextResponse } from "next/server";
import {
  importInstagram,
  removeEntry,
  resetRaffle,
  saveConfig,
  setForcedWinner,
} from "@/lib/store";

// Esta ruta ya está protegida por middleware.ts (matcher /api/raffle/admin/:path*),
// que valida la cookie de sesión antes de que el código de aquí abajo corra.

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  switch (action) {
    case "saveConfig": {
      const state = await saveConfig(body.config);
      return NextResponse.json(state);
    }
    case "importInstagram": {
      const names: string[] = (body.names || "")
        .split("\n")
        .map((s: string) => s.trim())
        .filter(Boolean);
      const state = await importInstagram(names);
      return NextResponse.json(state);
    }
    case "removeEntry": {
      const state = await removeEntry(body.id);
      return NextResponse.json(state);
    }
    case "setForcedWinner": {
      const state = await setForcedWinner(body.entryId || null);
      return NextResponse.json(state);
    }
    case "reset": {
      const state = await resetRaffle();
      return NextResponse.json(state);
    }
    default:
      return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
  }
}
