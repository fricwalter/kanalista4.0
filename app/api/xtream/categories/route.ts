import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createXtreamAPI } from "@/lib/xtream";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as "live" | "vod" | "series";
    const credId = searchParams.get("credentialId");

    if (!type || !["live", "vod", "series"].includes(type)) {
      return NextResponse.json(
        { error: "Ungültiger Typ: live, vod oder series erwartet" },
        { status: 400 }
      );
    }

    if (!credId) {
      return NextResponse.json(
        { error: "credentialId erforderlich" },
        { status: 400 }
      );
    }

    // User ID aus der Session holen
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("google_id", session.user.id)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: "Benutzer nicht gefunden" },
        { status: 404 }
      );
    }

    // Xtream Credentials aus Supabase laden
    const { data: cred } = await supabaseAdmin
      .from("xtream_credentials")
      .select("dns, username, password")
      .eq("id", credId)
      .eq("user_id", user.id)
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
