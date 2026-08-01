"use client";

/* eslint-disable @next/next/no-img-element */
import { ArrowLeft, CalendarDays, Clock3, ExternalLink, Star, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BackToTop from "@/app/_components/back-to-top";
import { useLanguage } from "@/app/_components/language-context";
import type { MediaDetails, StoredMediaPreview, TmdbMediaKind } from "@/types/media-detail";

type MediaDetailProps = {
  kind: TmdbMediaKind;
  slug: string;
  sourceTitle: string;
  year: string;
};

export default function MediaDetail({ kind, slug, sourceTitle, year }: MediaDetailProps) {
  const { language } = useLanguage();
  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [preview, setPreview] = useState<StoredMediaPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const section = kind === "movie" ? "filme" : "serien";

  const labels = language === "bsk" ? {
    back: kind === "movie" ? "Nazad na filmove" : "Nazad na serije",
    description: "Opis",
    cast: "Glumci",
    director: kind === "movie" ? "Režija" : "Autor",
    runtime: "Trajanje",
    seasons: "Sezona",
    imdb: "Otvori na IMDb-u",
    loading: "Učitava detalje …",
    unavailable: "Dodatni opis trenutno nije dostupan.",
  } : {
    back: kind === "movie" ? "Zurück zu Filme" : "Zurück zu Serien",
    description: "Handlung",
    cast: "Besetzung",
    director: kind === "movie" ? "Regie" : "Erstellt von",
    runtime: "Laufzeit",
    seasons: "Staffeln",
    imdb: "Bei IMDb öffnen",
    loading: "Details werden geladen …",
    unavailable: "Eine zusätzliche Beschreibung ist derzeit nicht verfügbar.",
  };

  useEffect(() => {
    const storageKind = kind === "movie" ? "vod" : "series";
    try {
      const stored = window.sessionStorage.getItem(`kanalista_detail_${storageKind}_${slug}`);
      if (stored) setPreview(JSON.parse(stored) as StoredMediaPreview);
    } catch {
      // TMDB bleibt die primaere Quelle.
    }
  }, [kind, slug]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      kind,
      title: sourceTitle,
      language: language === "de" ? "de-DE" : "bs-BA",
    });
    if (year) params.set("year", year);
    setLoading(true);
    setFailed(false);
    fetch(`/api/tmdb-details?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Details fehlen");
        setDetails(await response.json() as MediaDetails);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setFailed(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [kind, language, sourceTitle, year]);

  const title = details?.title || preview?.title || sourceTitle;
  const overview = details?.overview || preview?.plot || "";
  const poster = details?.posterUrl || preview?.image || "";
  const genres = details?.genres.length ? details.genres : preview?.genre ? preview.genre.split(/\s*\/\s*|\s*,\s*/).filter(Boolean) : [];
  const rating = details?.rating || Number.parseFloat(preview?.rating || "") || 0;
  const releaseDate = details?.releaseDate || preview?.releaseDate || (year ? `${year}-01-01` : "");
  const releaseYear = releaseDate.match(/^(\d{4})/)?.[1] || year;
  const facts = useMemo(() => [
    releaseYear ? { icon: CalendarDays, value: releaseYear } : null,
    details?.runtime ? { icon: Clock3, value: `${details.runtime} min` } : null,
    rating ? { icon: Star, value: rating.toFixed(1) } : null,
  ].filter(Boolean) as Array<{ icon: typeof CalendarDays; value: string }>, [details?.runtime, rating, releaseYear]);

  return (
    <main className="detail-page">
      <div
        className="detail-backdrop"
        style={details?.backdropUrl ? { backgroundImage: `linear-gradient(90deg, rgba(28,25,23,.94), rgba(28,25,23,.58)), url(${details.backdropUrl})` } : undefined}
        aria-hidden="true"
      />
      <div className="detail-shell">
        <Link href={`/${section}`} className="detail-back-link">
          <ArrowLeft aria-hidden="true" size={18} /> {labels.back}
        </Link>

        <section className="detail-hero" aria-busy={loading}>
          <div className="detail-poster">
            {poster ? <img src={poster} alt="" /> : <span aria-hidden="true">{kind === "movie" ? "F" : "S"}</span>}
          </div>
          <div className="detail-copy">
            <p className="catalog-eyebrow">{kind === "movie" ? "Film" : language === "bsk" ? "Serija" : "Serie"}</p>
            <h1>{title}</h1>
            <div className="detail-facts">
              {facts.map(({ icon: Icon, value }) => <span key={value}><Icon aria-hidden="true" size={16} />{value}</span>)}
            </div>
            {genres.length > 0 && <div className="detail-genres">{genres.map((genre) => <span key={genre}>{genre}</span>)}</div>}
            {loading && <p className="detail-loading" role="status">{labels.loading}</p>}
          </div>
        </section>

        <section className="detail-content">
          <div>
            <h2>{labels.description}</h2>
            <p>{overview || labels.unavailable}</p>
            {failed && !preview?.plot && <p className="detail-notice">{labels.unavailable}</p>}
          </div>
          <aside className="detail-meta">
            {details?.director && <div><strong>{labels.director}</strong><span>{details.director}</span></div>}
            {details?.cast.length ? <div><strong><Users aria-hidden="true" size={15} /> {labels.cast}</strong><span>{details.cast.join(", ")}</span></div> : null}
            {details?.seasons ? <div><strong>{labels.seasons}</strong><span>{details.seasons}</span></div> : null}
            {details?.runtime ? <div><strong>{labels.runtime}</strong><span>{details.runtime} min</span></div> : null}
            {details?.imdbId && (
              <a href={`https://www.imdb.com/title/${details.imdbId}/`} target="_blank" rel="noopener noreferrer">
                {labels.imdb} <ExternalLink aria-hidden="true" size={15} />
              </a>
            )}
          </aside>
        </section>
      </div>
      <BackToTop />
    </main>
  );
}
