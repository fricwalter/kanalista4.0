import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: Request) {
  const auth = req.headers.get("Authorization");
  if (auth !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Supabase Umgebungsvariablen fehlen" }, { status: 500 });
  }

  const res = await fetch(`${baseUrl}/functions/v1/fetch-xtream-data`, {
    method: "POST",
    headers: { Authorization: `Bearer ${serviceRoleKey}` },
  });

  const data = (await res.json()) as unknown;
  return NextResponse.json(data);
}
