import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { resolveSessionUser } from "@/lib/resolve-auth-user";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = await resolveSessionUser(session);

    if (!currentUser) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const marketingOptIn = Boolean(body.marketingOptIn);

    const { error } = await supabaseAdmin
      .from("users")
      .update({
        marketing_opt_in: marketingOptIn,
        marketing_opt_in_at: marketingOptIn ? new Date().toISOString() : null,
      })
      .eq("id", currentUser.id);

    if (error) {
      return NextResponse.json({ error: "Einwilligung konnte nicht gespeichert werden" }, { status: 500 });
    }

    return NextResponse.json({ success: true, marketingOptIn });
  } catch {
    return NextResponse.json({ error: "Fehler beim Speichern der Einwilligung" }, { status: 500 });
  }
}
