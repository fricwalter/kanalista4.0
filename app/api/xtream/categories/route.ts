import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createXtreamAPI } from "@/lib/xtream";
import { listAdminUserIds, resolveSessionUser } from "@/lib/resolve-auth-user";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = await resolveSessionUser(session);
    if (!currentUser) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as "live" | "vod" | "series";
    const credId = searchParams.get("credentialId");

    if (!type || !["live", "vod", "series"].includes(type)) {
      return NextResponse.json(
        { error: "UngÃ¼ltiger Typ: live, vod oder series erwartet" },
        { status: 400 }
      );
    }

    if (!credId) {
      return NextResponse.json(
        { error: "credentialId erforderlich" },
        { status: 400 }
      );
    }

    const visibleOwnerIds = currentUser.isAdmin
      ? [currentUser.id]
      : await listAdminUserIds();

    if (visibleOwnerIds.length === 0) {
      return NextResponse.json(
        { error: "Keine Admin-Zugangsdaten vorhanden" },
        { status: 404 }
      );
    }

    // Xtream Credentials aus Supabase laden
    const { data: cred } = await supabaseAdmin
      .from("xtream_credentials")
      .select("dns, username, password")
      .eq("id", credId)
      .in("user_id", visibleOwnerIds)
      .single();

    if (!cred) {
      return NextResponse.json(
        { error: "Credentials nicht gefunden oder nicht berechtigt" },
        { status: 404 }
      );
    }

    // Kategorien von Xtream API laden
    const api = createXtreamAPI(cred.dns, cred.username, cred.password);
    let categories;

    switch (type) {
      case "live":
        categories = await api.getLiveCategories();
        break;
      case "vod":
        categories = await api.getVodCategories();
        break;
      case "series":
        categories = await api.getSeriesCategories();
        break;
    }

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error("Categories error:", error);
    return NextResponse.json(
      { error: error.message || "Fehler beim Laden der Kategorien" },
      { status: 500 }
    );
  }
}
