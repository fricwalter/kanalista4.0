import type { Session } from "next-auth";
import { supabaseAdmin } from "./supabase-admin";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DEFAULT_ADMIN_EMAILS = ["admirfric@gmail.com"];

type UserRow = {
  id: string;
  email: string;
  google_id: string;
  is_admin: boolean | null;
  marketing_opt_in: boolean | null;
};

function configuredAdminEmails(): string[] {
  const fromEnv = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(new Set([...DEFAULT_ADMIN_EMAILS, ...fromEnv]));
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return configuredAdminEmails().includes(email.toLowerCase());
}

export async function listAdminUserIds(): Promise<string[]> {
  const { data: adminsByFlag } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("is_admin", true);

  const flaggedIds = (adminsByFlag || []).map((u: any) => u.id).filter(Boolean);
  if (flaggedIds.length > 0) {
    return flaggedIds;
  }

  const emails = configuredAdminEmails();
  const { data: adminsByEmail } = await supabaseAdmin
    .from("users")
    .select("id,email")
    .in("email", emails);

  return (adminsByEmail || []).map((u: any) => u.id).filter(Boolean);
}

async function findSessionUser(session: Session): Promise<UserRow | null> {
  const sessionId = session.user.id;
  const email = session.user.email || null;

  if (sessionId && UUID_REGEX.test(sessionId)) {
    const { data } = await supabaseAdmin
      .from("users")
      .select("id,email,google_id,is_admin,marketing_opt_in")
      .eq("id", sessionId)
      .single();

    if (data) return data as UserRow;
  }

  if (email) {
    const { data } = await supabaseAdmin
      .from("users")
      .select("id,email,google_id,is_admin,marketing_opt_in")
      .eq("email", email)
      .single();

    if (data) return data as UserRow;
  }

  if (sessionId) {
    const { data } = await supabaseAdmin
      .from("users")
      .select("id,email,google_id,is_admin,marketing_opt_in")
      .eq("google_id", sessionId)
      .single();

    if (data) return data as UserRow;
  }

  return null;
}

export async function resolveSessionUser(session: Session | null): Promise<{
  id: string;
  email: string;
  isAdmin: boolean;
  marketingOptIn: boolean;
} | null> {
  if (!session?.user) {
    return null;
  }

  const row = await findSessionUser(session);
  if (!row) {
    return null;
  }

  const admin = Boolean(row.is_admin) || isAdminEmail(row.email);

  if (admin && !row.is_admin) {
    await supabaseAdmin.from("users").update({ is_admin: true }).eq("id", row.id);
  }

  return {
    id: row.id,
    email: row.email,
    isAdmin: admin,
    marketingOptIn: Boolean(row.marketing_opt_in),
  };
}

export async function resolveAuthenticatedUserId(
  session: Session | null
): Promise<string | null> {
  const user = await resolveSessionUser(session);
  return user?.id || null;
}
