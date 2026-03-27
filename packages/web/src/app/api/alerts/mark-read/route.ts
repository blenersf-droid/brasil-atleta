import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/roles";

// ── POST /api/alerts/mark-read ────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body.alertId !== "string") {
      return NextResponse.json(
        { error: "alertId é obrigatório" },
        { status: 400 }
      );
    }

    const { alertId } = body as { alertId: string };

    const supabase = await createClient();

    const { error } = await supabase
      .from("scouting_alerts")
      .update({ is_read: true })
      .eq("id", alertId);

    if (error) {
      console.error("Error marking alert as read:", error);
      return NextResponse.json(
        { error: "Erro ao marcar alerta como lido" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in /api/alerts/mark-read:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
