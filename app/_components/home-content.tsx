"use client";

import Link from "next/link";
import { ArrowRight, Clapperboard, Film, Search, Tv } from "lucide-react";
import { useLanguage } from "@/app/_components/language-context";

export default function HomeContent({ live, vod, series }: { live: number; vod: number; series: number }) {
  const { copy } = useLanguage();
  const areas = [
    { href: "/live", label: copy.home.live, count: live, icon: Tv, note: copy.home.liveNote },
    { href: "/filme", label: copy.home.movies, count: vod, icon: Film, note: copy.home.moviesNote },
    { href: "/serien", label: copy.home.series, count: series, icon: Clapperboard, note: copy.home.seriesNote },
  ];

  return (
    <main className="home-page">
      <div className="home-shell">
        <section className="home-intro">
          <div>
            <p className="home-intro__eyebrow">Kanalista 4.0</p>
            <h1>{copy.home.title}</h1>
            <p className="home-intro__lead">{copy.home.lead}</p>
          </div>
          <div className="home-actions">
            <Link href="/live" className="primary-button">{copy.home.openLive} <ArrowRight size={18} aria-hidden="true" /></Link>
            <Link href="/suche" className="secondary-button"><Search size={18} aria-hidden="true" /> {copy.home.searchAll}</Link>
          </div>
        </section>

        <section className="catalog-links" aria-label={copy.home.contents}>
          {areas.map(({ href, label, count, icon: Icon, note }) => (
            <Link key={href} href={href} className="catalog-link">
              <span className="catalog-link__icon"><Icon size={22} aria-hidden="true" /></span>
              <strong className="catalog-link__count">{count.toLocaleString("de-DE")}</strong>
              <span className="catalog-link__label"><span>{label}<small>{note}</small></span><ArrowRight size={20} aria-hidden="true" /></span>
            </Link>
          ))}
        </section>
        <p className="home-note">{copy.home.footnote}</p>
      </div>
    </main>
  );
}
