import { NextRequest, NextResponse } from "next/server";
import { verifyUserToken } from "@/lib/auth";
import { getUserById } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("user_session")?.value;
    const userId = await verifyUserToken(token);
    if (!userId) {
      return NextResponse.json({ user: null });
    }
    const user = await getUserById(userId);
    return NextResponse.json({ user });
  } catch (err) {
    console.error("Error en GET /api/auth/me:", err);
    return NextResponse.json({ user: null });
  }
}
