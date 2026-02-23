import { signIn } from "@/lib/auth";
import { Github } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card p-10 text-center max-w-md w-full">
        {/* Logo / Title */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <span className="text-4xl">📺</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Kanalista 4.0
          </h1>
          <p className="text-gray-400">
            Dein moderner IPTV Channel Browser
          </p>
        </div>

        {/* Features */}
        <div className="glass-card p-4 mb-8 text-left">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Features</h2>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-center gap-2">
              <span className="text-violet-400">✓</span>
              Live TV, VOD & Serien
            </li>
            <li className="flex items-center gap-2">
              <span className="text-violet-400">✓</span>
              Glass-Morphism UI
            </li>
            <li className="flex items-center gap-2">
              <span className="text-violet-400">✓</span>
              Sicher & privat
            </li>
          </ul>
        </div>

        {/* Login Form */}
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="glass-button-primary w-full py-3 px-6 rounded-xl flex items-center justify-center gap-3 text-lg"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Mit Google anmelden
          </button>
        </form>

        {/* Footer */}
        <p className="text-xs text-gray-500 mt-6">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </main>
  );
}
