import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { supabaseAdmin } from "./supabase-admin";

const googleClientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || "";
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "";
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  secret: authSecret,
  trustHost: true,
  callbacks: {
    async signIn({ user, account }) {
      if (!account?.providerAccountId || !user.email) {
        return false;
      }

      // User in Supabase speichern/updaten
      const { error } = await supabaseAdmin
        .from("users")
        .upsert(
          {
            google_id: account.providerAccountId,
            email: user.email,
            name: user.name,
            avatar_url: user.image,
          },
          { onConflict: "google_id" }
        );

      return !error;
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
