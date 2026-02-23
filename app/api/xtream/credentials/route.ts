import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { listAdminUserIds, resolveSessionUser } from "@/lib/resolve-auth-user";

export const runtime = "edge";

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = await resolveSessionUser(session);

    if (!currentUser) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const visibleOwnerIds = currentUser.isAdmin
      ? [currentUser.id]
      : await listAdminUserIds();

    if (visibleOwnerIds.length === 0) {
      return NextResponse.json({ credentials: [] });
    }

    const { data: credentials, error } = await supabaseAdmin
      .from("xtream_credentials")
      .select("id, dns, label, created_at")
      .in("user_id", visibleOwnerIds)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Fehler beim Laden der Credentials" }, { status: 500 });
    }

    return NextResponse.json({ credentials: credentials || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Fehler" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = await resolveSessionUser(session);

    if (!currentUser) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    if (!currentUser.isAdmin) {
      return NextResponse.json(
        { error: "Nur Admin darf Zugangsdaten verwalten" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const credentialId = searchParams.get("id");

    if (!credentialId) {
      return NextResponse.json({ error: "Credential ID erforderlich" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("xtream_credentials")
      .delete()
      .eq("id", credentialId)
      .eq("user_id", currentUser.id);

    if (error) {
      return NextResponse.json({ error: "Fehler beim Loeschen der Credential" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Fehler" }, { status: 500 });
  }
}