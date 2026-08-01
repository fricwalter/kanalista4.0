import { NextRequest, NextResponse } from "next/server";
import { readMediaMetadataCache, writeMediaMetadataCache } from "@/lib/media-metadata-cache";
import type { MediaDetails, TmdbMediaKind } from "@/types/media-detail";

export const runtime = "edge";

type TmdbSearchItem = {
  id?: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  release_date?: string;
  first_air_date?: string;
};

type JsonRecord = Record<string, unknown>;

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function selectBestResult(results: TmdbSearchItem[], title: string, year: string): TmdbSearchItem | null {
  const wanted = normalize(title);
  return results
    .filter((item): item is TmdbSearchItem & { id: number } => typeof item.id === "number")
    .map((item, index) => {
      const names = [item.title, item.name, item.original_title, item.original_name].filter((value): value is string => typeof value === "string");
      const exact = names.some((name) => normalize(name) === wanted);
      const date = item.release_date || item.first_air_date || "";
      const yearMatch = Boolean(year && date.startsWith(year));
      return { item, score: (exact ? 100 : 0) + (yearMatch ? 30 : 0) - index };
    })
    .sort((a, b) => b.score - a.score)[0]?.item || null;
}

async function tmdbFetch(path: string, token: string): Promise<JsonRecord | null> {
  const response = await fetch(`https://api.themoviedb.org/3${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!response.ok) return null;
  return await response.json() as JsonRecord;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

async function fetchTmdbDetails(
  kind: TmdbMediaKind,
  title: string,
  year: string,
  requestedLanguage: "bs-BA" | "de-DE",
  token: string,
): Promise<MediaDetails | null> {
  const titleCandidates = Array.from(new Set([title, ...title.split(/\s+\/\s+/)]));
  let matchedTitle = title;
  let results: TmdbSearchItem[] = [];
  for (const candidateTitle of titleCandidates) {
    const searchParams = new URLSearchParams({ query: candidateTitle, include_adult: "false", language: requestedLanguage });
    if (kind === "movie" && year) searchParams.set("primary_release_year", year);
    if (kind === "tv" && year) searchParams.set("first_air_date_year", year);
    let search = await tmdbFetch(`/search/${kind}?${searchParams.toString()}`, token);
    results = Array.isArray(search?.results) ? search.results as TmdbSearchItem[] : [];
    if (results.length === 0 && year) {
      searchParams.delete(kind === "movie" ? "primary_release_year" : "first_air_date_year");
      search = await tmdbFetch(`/search/${kind}?${searchParams.toString()}`, token);
      results = Array.isArray(search?.results) ? search.results as TmdbSearchItem[] : [];
    }
    if (results.length > 0) {
      matchedTitle = candidateTitle;
      break;
    }
  }

  const match = selectBestResult(results, matchedTitle, year);
  if (!match?.id) return null;

  const languages = Array.from(new Set([requestedLanguage, "de-DE", "en-US"]));
  let details: JsonRecord | null = null;
  for (const language of languages) {
    const candidate = await tmdbFetch(`/${kind}/${match.id}?language=${language}&append_to_response=external_ids,credits`, token);
    if (!candidate) continue;
    if (!details) details = candidate;
    if (stringValue(candidate.overview)) {
      details = { ...details, overview: candidate.overview, tagline: candidate.tagline || details.tagline };
      break;
    }
  }
  if (!details) return null;

  const credits = typeof details.credits === "object" && details.credits ? details.credits as JsonRecord : {};
  const crew = Array.isArray(credits.crew) ? credits.crew as JsonRecord[] : [];
  const cast = Array.isArray(credits.cast) ? credits.cast as JsonRecord[] : [];
  const externalIds = typeof details.external_ids === "object" && details.external_ids ? details.external_ids as JsonRecord : {};
  const genres = Array.isArray(details.genres) ? (details.genres as JsonRecord[]).map((genre) => stringValue(genre.name)).filter(Boolean) : [];
  const episodeRunTime = Array.isArray(details.episode_run_time) ? details.episode_run_time.find((value) => typeof value === "number") : null;
  const posterPath = stringValue(details.poster_path);
  const backdropPath = stringValue(details.backdrop_path);

  return {
    id: match.id,
    title: stringValue(details.title) || stringValue(details.name) || title,
    originalTitle: stringValue(details.original_title) || stringValue(details.original_name),
    overview: stringValue(details.overview),
    tagline: stringValue(details.tagline),
    posterUrl: posterPath ? `https://image.tmdb.org/t/p/w780${posterPath}` : "",
    backdropUrl: backdropPath ? `https://image.tmdb.org/t/p/w1280${backdropPath}` : "",
    rating: typeof details.vote_average === "number" ? details.vote_average : 0,
    releaseDate: stringValue(details.release_date) || stringValue(details.first_air_date),
    genres,
    runtime: typeof details.runtime === "number" ? details.runtime : typeof episodeRunTime === "number" ? episodeRunTime : null,
    seasons: typeof details.number_of_seasons === "number" ? details.number_of_seasons : null,
    cast: cast.slice(0, 6).map((person) => stringValue(person.name)).filter(Boolean),
    director: stringValue(crew.find((person) => person.job === "Director")?.name) || stringValue(details.created_by && Array.isArray(details.created_by) ? (details.created_by[0] as JsonRecord | undefined)?.name : ""),
    imdbId: stringValue(externalIds.imdb_id) || stringValue(details.imdb_id),
  };
}

function mediaResponse(details: MediaDetails, cacheStatus: string, cacheControl = "public, s-maxage=86400, stale-while-revalidate=604800") {
  return NextResponse.json(details, {
    headers: {
      "Cache-Control": cacheControl,
      "X-Metadata-Cache": cacheStatus,
    },
  });
}

export async function GET(request: NextRequest) {
  const kind = request.nextUrl.searchParams.get("kind") as TmdbMediaKind | null;
  const title = request.nextUrl.searchParams.get("title")?.trim() || "";
  const year = request.nextUrl.searchParams.get("year")?.trim() || "";
  const requestedLanguage = request.nextUrl.searchParams.get("language") === "de-DE" ? "de-DE" : "bs-BA";
  const forceRefresh = request.nextUrl.searchParams.get("refresh") === "1";
  if ((kind !== "movie" && kind !== "tv") || title.length < 1 || title.length > 160 || (year && !/^(?:19|20)\d{2}$/.test(year))) {
    return NextResponse.json({ error: "Ungueltige Anfrage" }, { status: 400 });
  }

  const cached = await readMediaMetadataCache(kind, title, year, requestedLanguage);
  if (cached?.fresh && !forceRefresh) return mediaResponse(cached.details, "HIT");
  if (cached && !forceRefresh) {
    return mediaResponse(cached.details, "STALE", "private, no-store");
  }

  const token = process.env.TMDB_API_READ_ACCESS_TOKEN;
  if (!token) {
    if (cached) return mediaResponse(cached.details, "STALE-FALLBACK", "private, no-store");
    return NextResponse.json({ error: "TMDB ist nicht konfiguriert" }, { status: 503 });
  }

  const details = await fetchTmdbDetails(kind, title, year, requestedLanguage, token);
  if (!details) {
    if (cached) return mediaResponse(cached.details, "STALE-FALLBACK", "private, no-store");
    return NextResponse.json({ error: "Titel nicht gefunden" }, { status: 404 });
  }

  const stored = await writeMediaMetadataCache(kind, title, year, requestedLanguage, details);
  return mediaResponse(details, stored ? (forceRefresh ? "REFRESH" : "MISS") : "BYPASS");
}
