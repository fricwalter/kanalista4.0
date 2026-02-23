import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createXtreamAPI } from "@/lib/xtream";
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
    if (!currentUser.isAdmin) {
      return NextResponse.json(
        { error: "Nur Admin darf Zugangsdaten verwalten" },
        { status: 403 }
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

    // Credentials in Supabase speichern
    const { data: credential, error } = await supabaseAdmin
      .from("xtream_credentials")
      .insert({
        user_id: currentUser.id,
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
    const message = error?.message || "Fehler bei der Verbindung";
    const upstreamIssue =
      /Cloudflare|DNS|Timeout|nicht erreichbar|Verbindung/i.test(message);
    return NextResponse.json(
      { error: message },
      { status: upstreamIssue ? 502 : 400 }
    );
  }
}
