import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { supabaseAdmin } from "./supabase-admin";
import { isAdminEmail, isMissingColumnError } from "./resolve-auth-user";

const googleClientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || "";
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "";
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorization: "https://accounts.google.com/o/oauth2/v2/auth",
      token: "https://oauth2.googleapis.com/token",
      userinfo: "https://www.googleapis.com/oauth2/v3/userinfo",
    }),
  ],
  secret: authSecret,
  trustHost: true,
  callbacks: {
    async signIn({ user, account }) {
      try {
        if (!account?.providerAccountId || !user.email) {
          console.error("Auth signIn blocked: missing Google account id or email", {
            hasProviderAccountId: Boolean(account?.providerAccountId),
            hasEmail: Boolean(user.email),
          });
          return false;
        }

        const baseUser = {
          google_id: account.providerAccountId,
          email: user.email,
          name: user.name,
          avatar_url: user.image,
        };

        // User in Supabase speichern/updaten (schema-kompatibler Upsert)
        const { error: upsertByEmailError } = await supabaseAdmin
          .from("users")
          .upsert(baseUser, { onConflict: "email" });

        if (upsertByEmailError) {
          const { error: upsertByGoogleIdError } = await supabaseAdmin
            .from("users")
            .upsert(baseUser, { onConflict: "google_id" });

          if (upsertByGoogleIdError) {
            // Do not block OAuth login when user sync fails due env/DB issues.
            // Blocking here causes /api/auth/error?error=AccessDenied.
            console.error("Auth user sync failed (continuing sign-in):", {
              byEmail: {
                code: upsertByEmailError.code,
                message: upsertByEmailError.message,
                details: upsertByEmailError.details,
              },
              byGoogleId: {
                code: upsertByGoogleIdError.code,
                message: upsertByGoogleIdError.message,
                details: upsertByGoogleIdError.details,
              },
            });
            return true;
          }
        }

        if (isAdminEmail(user.email)) {
          const { error: adminFlagError } = await supabaseAdmin
            .from("users")
            .update({ is_admin: true })
            .eq("email", user.email);

          if (adminFlagError && !isMissingColumnError(adminFlagError)) {
            console.warn("Admin flag update failed:", adminFlagError);
          }
        }

        return true;
      } catch (error) {
        console.error("Auth signIn callback error (continuing sign-in):", error);
        return true;
      }
    },
    async session({ session, token }) {
      if (!token.sub) {
        return session;
      }

      // Supabase User ID in Session injizieren
      const { data } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("google_id", token.sub)
        .single();

      if (data) {
        session.user.id = data.id;
      }

      return session;
    },
  },
  pages: {
    signIn: "/", // Landing Page als Login
  },
  session: {
    strategy: "jwt",
  },
});
