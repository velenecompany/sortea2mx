import { NextRequest, NextResponse } from "next/server";
import { verifyUserToken } from "@/lib/auth";
import { isValidSessionToken } from "@/lib/session";
import { drawWinner, isOwnedBy } from "@/lib/store";

export const dynamic = "force-dynamic";

// Ya no es pública: solo tú (PIN de /ceo) o el dueño de la cuenta que creó
// este sorteo pueden dispararlo. Los participantes solo ven el resultado.
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const ceoToken = req.cookies.get("ceo_session")?.value;
    const isCeo = await isValidSessionToken(ceoToken);

    if (!isCeo) {
      const userToken = req.cookies.get("user_session")?.value;
      const userId = await verifyUserToken(userToken);
      const owned = userId ? await isOwnedBy(params.slug, userId) : false;
      if (!owned) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
    }

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
