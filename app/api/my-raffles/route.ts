import { NextRequest, NextResponse } from "next/server";
import { verifyUserToken } from "@/lib/auth";
import { listRafflesByUser } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("user_session")?.value;
  const userId = await verifyUserToken(token);
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const raffles = await listRafflesByUser(userId);
    return NextResponse.json({ raffles });
  } catch (err) {
    console.error("Error en GET /api/my-raffles:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
