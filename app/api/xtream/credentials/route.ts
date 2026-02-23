import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { resolveAuthenticatedUserId } from "@/lib/resolve-auth-user";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    const userId = await resolveAuthenticatedUserId(session);
    if (!userId) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    // Alle Credentials des Users abrufen
    const { data: credentials, error } = await supabaseAdmin
      .from("xtream_credentials")
      .select("id, dns, username, label, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Fehler beim Laden der Credentials" },
        { status: 500 }
      );
    }

    return NextResponse.json({ credentials: credentials || [] });
  } catch (error: any) {
    console.error("Credentials GET error:", error);
    return NextResponse.json(
      { error: error.message || "Fehler" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const credentialId = searchParams.get("id");

    if (!credentialId) {
      return NextResponse.json(
        { error: "Credential ID erforderlich" },
        { status: 400 }
      );
    }

    const userId = await resolveAuthenticatedUserId(session);
    if (!userId) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    // Credential lÃ¶schen (nur wenn es dem User gehÃ¶rt)
    const { error } = await supabaseAdmin
      .from("xtream_credentials")
      .delete()
      .eq("id", credentialId)
      .eq("user_id", userId);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Fehler beim LÃ¶schen der Credential" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Credentials DELETE error:", error);
    return NextResponse.json(
      { error: error.message || "Fehler" },
      { status: 500 }
    );
  }
}
