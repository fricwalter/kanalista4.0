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
    const categoryId = searchParams.get("categoryId");
    const forceRefresh = searchParams.get("refresh") === "true";

    if (!type || !["live", "vod", "series"].includes(type)) {
      return NextResponse.json(
        { error: "Ungueltiger Typ: live, vod oder series erwartet" },
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

    if (!forceRefresh && !categoryId) {
      const { data: cached } = await supabaseAdmin
        .from("channel_cache")
        .select("data, cached_at")
        .eq("credential_id", credId)
        .eq("type", type)
        .single();

      if (cached) {
        return NextResponse.json({
          data: cached.data,
          fromCache: true,
          cachedAt: cached.cached_at,
        });
      }
    }

    const { data: cred } = await supabaseAdmin
      .from("xtream_credentials")
      .select("*")
      .eq("id", credId)
      .in("user_id", visibleOwnerIds)
      .single();

    if (!cred) {
      return NextResponse.json(
        { error: "Credentials nicht gefunden oder nicht berechtigt" },
        { status: 404 }
      );
    }

    const api = createXtreamAPI(cred.dns, cred.username, cred.password);
    let data;

    switch (type) {
      case "live":
        data = await api.getLiveStreams(categoryId || undefined);
        break;
      case "vod":
        data = await api.getVodStreams(categoryId || undefined);
        break;
      case "series":
        data = await api.getAllSeries(categoryId || undefined);
        break;
    }

    if (!categoryId) {
      await supabaseAdmin.from("channel_cache").upsert(
        {
          user_id: cred.user_id,
          credential_id: credId,
          type,
          data,
          cached_at: new Date().toISOString(),
        },
        { onConflict: "credential_id,type" }
      );
    }

    return NextResponse.json({
      data,
      fromCache: false,
    });
  } catch (error: any) {
    console.error("Channels error:", error);
    return NextResponse.json(
      { error: error.message || "Fehler beim Laden der Kanaele" },
      { status: 500 }
    );
  }
}
