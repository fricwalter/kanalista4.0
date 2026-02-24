import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/resolve-auth-user";
import MarketingConsentGate from "./marketing-consent-gate";

export const runtime = "edge";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const currentUser = await resolveSessionUser(session);

  if (!session) {
    redirect("/");
  }

  const showConsentGate =
    currentUser !== null && !currentUser.isAdmin && !currentUser.marketingOptIn;

  if (showConsentGate) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <MarketingConsentGate />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="glass-card border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
              <Image
                src="/logo.png"
                alt="Kanalista Logo"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xl font-bold text-white">Kanalista 4.0</span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="glass-button px-4 py-2 rounded-lg text-sm"
            >
              Dashboard
            </Link>
            {currentUser?.isAdmin && (
              <Link
                href="/credentials"
                className="glass-button px-4 py-2 rounded-lg text-sm"
              >
                Zugangsdaten
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">{children}</main>
    </div>
  );
}
