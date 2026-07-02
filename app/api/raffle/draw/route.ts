import { NextResponse } from "next/server";
import { drawWinner } from "@/lib/store";

export const dynamic = "force-dynamic";

// Ruta pública a propósito: cualquiera puede disparar el sorteo (como en
// cualquier página de rifas). Lo que decide el resultado sigue siendo
// privado — si el creador fijó un ganador desde /ceo, drawWinner() lo
// respeta sin que quede rastro en esta ruta.

export async function POST() {
  const { state, winner } = await drawWinner();
  return NextResponse.json({ ...state, winner });
}
