import type { Session } from "next-auth";
import { supabaseAdmin } from "./supabase-admin";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function resolveAuthenticatedUserId(
  session: Session | null
): Promise<string | null> {
  if (!session?.user) {
    return null;
  }

  const sessionId = session.user.id;
  const email = session.user.email || null;

  if (sessionId && UUID_REGEX.test(sessionId)) {
    const { data } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", sessionId)
      .single();

    if (data?.id) {
      return data.id;
    }
  }

  if (email) {
    const { data } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (data?.id) {
      return data.id;
    }
  }

  if (sessionId) {
    const { data } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("google_id", sessionId)
      .single();

    if (data?.id) {
      return data.id;
    }
  }

  return null;
}
