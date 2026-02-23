import { NextResponse } from "next/server";

export const runtime = "edge";

function envLength(name: string): number {
  const v = process.env[name];
  return typeof v === "string" ? v.length : 0;
}

export async function GET() {
  return NextResponse.json({
    nodeVersion: process.version,
    has: {
      AUTH_SECRET: envLength("AUTH_SECRET") > 0,
      NEXTAUTH_SECRET: envLength("NEXTAUTH_SECRET") > 0,
      AUTH_URL: envLength("AUTH_URL") > 0,
      NEXTAUTH_URL: envLength("NEXTAUTH_URL") > 0,
      GOOGLE_CLIENT_ID: envLength("GOOGLE_CLIENT_ID") > 0,
      GOOGLE_CLIENT_SECRET: envLength("GOOGLE_CLIENT_SECRET") > 0,
      AUTH_GOOGLE_ID: envLength("AUTH_GOOGLE_ID") > 0,
      AUTH_GOOGLE_SECRET: envLength("AUTH_GOOGLE_SECRET") > 0,
      NEXT_PUBLIC_SUPABASE_URL: envLength("NEXT_PUBLIC_SUPABASE_URL") > 0,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: envLength("NEXT_PUBLIC_SUPABASE_ANON_KEY") > 0,
      SUPABASE_SERVICE_ROLE_KEY: envLength("SUPABASE_SERVICE_ROLE_KEY") > 0,
    },
    length: {
      AUTH_SECRET: envLength("AUTH_SECRET"),
      NEXTAUTH_SECRET: envLength("NEXTAUTH_SECRET"),
      GOOGLE_CLIENT_ID: envLength("GOOGLE_CLIENT_ID"),
      GOOGLE_CLIENT_SECRET: envLength("GOOGLE_CLIENT_SECRET"),
    },
  });
}
