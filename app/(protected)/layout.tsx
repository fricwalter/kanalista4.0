import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";

export const runtime = "edge";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-card border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <span className="text-xl">📺</span>
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
            <Link
              href="/credentials"
              className="glass-button px-4 py-2 rounded-lg text-sm"
            >
              Zugangsdaten
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">{children}</main>
    </div>
  );
}
