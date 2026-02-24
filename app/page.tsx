import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import GoogleSignInButton from "./google-signin-button";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card p-10 text-center max-w-md w-full">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden shadow-lg shadow-violet-500/30 border border-white/10">
            <Image
              src="/logo.png"
              alt="Kanalista Logo"
              width={80}
              height={80}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Kanalista 4.0</h1>
          <p className="text-gray-400">Dein moderner IPTV Channel Browser</p>
        </div>

        <div className="glass-card p-4 mb-8 text-left">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Features</h2>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-center gap-2">
              <span className="text-violet-400">*</span>
              Live TV, VOD & Serien
            </li>
            <li className="flex items-center gap-2">
              <span className="text-violet-400">*</span>
              Glass-Morphism UI
            </li>
            <li className="flex items-center gap-2">
              <span className="text-violet-400">*</span>
              Sicher & privat
            </li>
          </ul>
        </div>

        <GoogleSignInButton />

        <p className="text-xs text-gray-500 mt-6">
          Mit der Nutzung akzeptierst du unsere{" "}
          <Link
            href="/nutzungsbedingungen"
            className="text-violet-300 hover:text-violet-200 underline underline-offset-2"
          >
            Nutzungsbedingungen
          </Link>{" "}
          und{" "}
          <Link
            href="/datenschutz"
            className="text-violet-300 hover:text-violet-200 underline underline-offset-2"
          >
            Datenschutzerklaerung
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
