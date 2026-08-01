import type { MediaDetails, TmdbMediaKind } from "@/types/media-detail";

const CACHE_DAYS = 30;

type CacheRow = {
  data: unknown;
  expires_at: string;
};

export type CachedMediaDetails = {
  details: MediaDetails;
  fresh: boolean;
};

export function normalizeMediaCacheTitle(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getServerSupabaseEnv(): { url: string; serviceKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return { url: url.replace(/\/$/, ""), serviceKey };
}

function isMediaDetails(value: unknown): value is MediaDetails {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<MediaDetails>;
  return typeof candidate.id === "number" && typeof candidate.title === "string";
}

function releaseYearValue(year: string): number {
  return /^(?:19|20)\d{2}$/.test(year) ? Number(year) : 0;
}

export async function readMediaMetadataCache(
  kind: TmdbMediaKind,
  title: string,
  year: string,
  language: "bs-BA" | "de-DE",
): Promise<CachedMediaDetails | null> {
  const env = getServerSupabaseEnv();
  if (!env) return null;

  const query = new URLSearchParams({
    select: "data,expires_at",
    media_type: `eq.${kind}`,
    normalized_title: `eq.${normalizeMediaCacheTitle(title)}`,
    release_year: `eq.${releaseYearValue(year)}`,
    language: `eq.${language}`,
    limit: "1",
  });

  try {
    const response = await fetch(`${env.url}/rest/v1/media_metadata_cache?${query.toString()}`, {
      headers: {
        apikey: env.serviceKey,
        Authorization: `Bearer ${env.serviceKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const rows = await response.json() as CacheRow[];
    const row = rows[0];
    if (!row || !isMediaDetails(row.data)) return null;
    return {
      details: row.data,
      fresh: Date.parse(row.expires_at) > Date.now(),
    };
  } catch {
    return null;
  }
}

export async function writeMediaMetadataCache(
  kind: TmdbMediaKind,
  title: string,
  year: string,
  language: "bs-BA" | "de-DE",
  details: MediaDetails,
): Promise<boolean> {
  const env = getServerSupabaseEnv();
  if (!env) return false;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + CACHE_DAYS * 24 * 60 * 60 * 1000);
  const query = new URLSearchParams({
    on_conflict: "media_type,normalized_title,release_year,language",
  });

  try {
    const response = await fetch(`${env.url}/rest/v1/media_metadata_cache?${query.toString()}`, {
      method: "POST",
      headers: {
        apikey: env.serviceKey,
        Authorization: `Bearer ${env.serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        media_type: kind,
        source_title: title,
        normalized_title: normalizeMediaCacheTitle(title),
        release_year: releaseYearValue(year),
        language,
        tmdb_id: details.id,
        data: details,
        fetched_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      }),
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}
