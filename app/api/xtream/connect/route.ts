import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createXtreamAPI } from "@/lib/xtream";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { dns, username, password, label } = body;

    // Validierung
    if (!dns || !username || !password) {
      return NextResponse.json(
        { error: "DNS, Username und Password erforderlich" },
        { status: 400 }
      );
    }

    // Xtream Credentials validieren
    const xtream = createXtreamAPI(dns, username, password);
    const userInfo = await xtream.validateLogin();

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

    // Credentials in Supabase speichern
    const { data: credential, error } = await supabaseAdmin
      .from("xtream_credentials")
      .insert({
        user_id: user.id,
        dns: dns.replace(/\/$/, ""),
        username,
        password,
        label: label || `Xtream ${new Date().toLocaleDateString()}`,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Fehler beim Speichern der Credentials" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      credentialId: credential.id,
      user: userInfo,
    });
  } catch (error: any) {
    console.error("Xtream connect error:", error);
    return NextResponse.json(
      { error: error.message || "Fehler bei der Verbindung" },
      { status: 400 }
    );
  }
}
