import Link from "next/link";
import { ArrowRight, Clapperboard, Film, Search, Tv } from "lucide-react";
import { getPublicChannelCount } from "@/lib/public-supabase";

export const revalidate = 604800;

const numberFormatter = new Intl.NumberFormat("de-DE");

export default async function Home() {
  const [live, vod, series] = await Promise.all([
    getPublicChannelCount("live"),
    getPublicChannelCount("vod"),
    getPublicChannelCount("series"),
  ]);

  const areas = [
    { href: "/live", label: "Live-Kanäle", count: live, icon: Tv, note: "EXYU zuerst, danach Deutschland" },
    { href: "/filme", label: "Filme", count: vod, icon: Film, note: "Schnell nach Kategorie filtern" },
    { href: "/serien", label: "Serien", count: series, icon: Clapperboard, note: "Übersichtlich und mobil optimiert" },
  ];

  return (
    <main className="home-page">
      <div className="home-shell">
        <section className="home-intro">
          <div>
            <p className="home-intro__eyebrow">Kanalista 4.0</p>
            <h1>Was läuft?</h1>
            <p className="home-intro__lead">
              Finde Live-Kanäle, Filme und Serien ohne Umwege. Die Übersicht zeigt keine
              Zugangsdaten oder Stream-Adressen.
            </p>
          </div>

          <div className="home-actions">
            <Link href="/live" className="primary-button">
              Live öffnen <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link href="/suche" className="secondary-button">
              <Search size={18} aria-hidden="true" /> Alles durchsuchen
            </Link>
          </div>
        </section>

        <section className="catalog-links" aria-label="Inhalte">
          {areas.map(({ href, label, count, icon: Icon, note }) => (
            <Link key={href} href={href} className="catalog-link">
              <span className="catalog-link__icon"><Icon size={22} aria-hidden="true" /></span>
              <strong className="catalog-link__count">{numberFormatter.format(count)}</strong>
              <span className="catalog-link__label">
                <span>{label}<small>{note}</small></span>
                <ArrowRight size={20} aria-hidden="true" />
              </span>
            </Link>
          ))}
        </section>

        <p className="home-note">Ein Katalog von EXJU TV · Für Handy, Tablet und Fernseher optimiert.</p>
      </div>
    </main>
  );
}
