import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  return NextResponse.json({
    hasAuthGoogleId: Boolean(process.env.AUTH_GOOGLE_ID),
    hasAuthGoogleSecret: Boolean(process.env.AUTH_GOOGLE_SECRET),
    hasGoogleClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
    hasGoogleClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET),
    hasAuthSecret: Boolean(process.env.AUTH_SECRET),
    hasNextAuthSecret: Boolean(process.env.NEXTAUTH_SECRET),
    hasNextAuthUrl: Boolean(process.env.NEXTAUTH_URL),
    hasSupabaseServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
  });
}
