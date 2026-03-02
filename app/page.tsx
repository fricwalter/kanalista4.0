import Link from "next/link";
import { getPublicChannelData } from "@/lib/public-supabase";

export const revalidate = 604800;

export default async function Home() {
  const [live, vod, series] = await Promise.all([
    getPublicChannelData("live"),
    getPublicChannelData("vod"),
    getPublicChannelData("series"),
  ]);

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="glass-card p-6 md:p-10">
          <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Kanalista 4.0</p>
          <h1 className="mt-3 text-3xl font-bold text-white md:text-5xl">Oeffentliche Kanaluebersicht</h1>
          <p className="mt-4 max-w-3xl text-sm text-gray-300 md:text-base">
            Hier siehst du alle verfuegbaren Live-Kanaele, Filme und Serien als oeffentliche Uebersicht.
            Stream-URLs und Zugangsdaten werden nicht angezeigt.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="glass-card-hover p-6">
            <p className="text-xs uppercase tracking-wide text-gray-400">Live-Kanaele</p>
            <p className="mt-2 text-4xl font-bold text-white">{live.count}</p>
            <Link href="/live" className="mt-4 inline-block text-sm text-violet-200 hover:text-violet-100">
              Zur Live-Uebersicht
            </Link>
          </div>

          <div className="glass-card-hover p-6">
            <p className="text-xs uppercase tracking-wide text-gray-400">Filme</p>
            <p className="mt-2 text-4xl font-bold text-white">{vod.count}</p>
            <Link href="/filme" className="mt-4 inline-block text-sm text-violet-200 hover:text-violet-100">
              Zur Film-Uebersicht
            </Link>
          </div>

          <div className="glass-card-hover p-6">
            <p className="text-xs uppercase tracking-wide text-gray-400">Serien</p>
            <p className="mt-2 text-4xl font-bold text-white">{series.count}</p>
            <Link href="/serien" className="mt-4 inline-block text-sm text-violet-200 hover:text-violet-100">
              Zur Serien-Uebersicht
            </Link>
          </div>
        </section>

        <section className="glass-card p-6">
          <div className="flex flex-wrap gap-3">
            <Link href="/suche" className="glass-button-primary rounded-lg px-4 py-2 text-sm">
              Globale Suche
            </Link>
            <Link href="/live" className="glass-button rounded-lg px-4 py-2 text-sm">
              Live
            </Link>
            <Link href="/filme" className="glass-button rounded-lg px-4 py-2 text-sm">
              Filme
            </Link>
            <Link href="/serien" className="glass-button rounded-lg px-4 py-2 text-sm">
              Serien
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
