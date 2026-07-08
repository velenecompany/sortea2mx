import { NextRequest, NextResponse } from "next/server";
import { verifyUserToken } from "@/lib/auth";
import {
  deleteRaffle,
  importInstagram,
  isOwnedBy,
  removeEntry,
  resetRaffle,
  saveConfig,
} from "@/lib/store";

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const token = req.cookies.get("user_session")?.value;
  const userId = await verifyUserToken(token);
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const owned = await isOwnedBy(params.slug, userId);
  if (!owned) {
    return NextResponse.json({ error: "Este sorteo no es tuyo" }, { status: 403 });
  }

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
      case "reset": {
        const state = await resetRaffle(slug);
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
    console.error("Error en POST /api/my-raffle/admin/[slug]:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
