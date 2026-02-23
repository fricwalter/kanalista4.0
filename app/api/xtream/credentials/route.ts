import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
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

    // Alle Credentials des Users abrufen
    const { data: credentials, error } = await supabaseAdmin
      .from("xtream_credentials")
      .select("id, dns, username, label, created_at")
      .eq("user_id", user.id)
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

    if (!session?.user?.id) {
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

    // Credential löschen (nur wenn es dem User gehört)
    const { error } = await supabaseAdmin
      .from("xtream_credentials")
      .delete()
      .eq("id", credentialId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Fehler beim Löschen der Credential" },
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
