import type { CacheCategory, PublicCategory } from "@/types/public-content";

export const WEEK_REVALIDATE_SECONDS = 604800;

type ChannelCacheResponse = {
  channel_count: number | null;
  fetched_at: string | null;
};

export type PublicChannelMeta = {
  channelCount: number;
  fetchedAt: string;
};

type CategoriesCacheResponse = {
  categories: PublicCategory[] | null;
};

function getSupabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

async function fetchPublicRows<T>(path: string): Promise<T[]> {
  const env = getSupabaseEnv();
  if (!env) return [];

  const res = await fetch(`${env.url}/rest/v1/${path}`, {
    headers: {
      apikey: env.anonKey,
      Authorization: `Bearer ${env.anonKey}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: WEEK_REVALIDATE_SECONDS },
  });

  if (!res.ok) {
    return [];
  }

  const json = (await res.json()) as unknown;
  if (!Array.isArray(json)) {
    return [];
  }

  return json as T[];
}

export async function getPublicChannelCount(category: CacheCategory): Promise<number> {
  return (await getPublicChannelMeta(category)).channelCount;
}

export async function getPublicChannelMeta(category: CacheCategory): Promise<PublicChannelMeta> {
  const query = new URLSearchParams({
    select: "channel_count,fetched_at",
    category: `eq.${category}`,
    order: "fetched_at.desc",
    limit: "1",
  });

  const rows = await fetchPublicRows<ChannelCacheResponse>(`channel_cache?${query.toString()}`);
  return {
    channelCount: typeof rows[0]?.channel_count === "number" ? rows[0].channel_count : 0,
    fetchedAt: typeof rows[0]?.fetched_at === "string" ? rows[0].fetched_at : "",
  };
}

export async function getPublicCategories(type: CacheCategory): Promise<PublicCategory[]> {
  const query = new URLSearchParams({
    select: "categories,fetched_at",
    type: `eq.${type}`,
    order: "fetched_at.desc",
    limit: "1",
  });

  const rows = await fetchPublicRows<CategoriesCacheResponse>(`categories_cache?${query.toString()}`);
  const first = rows[0];
  return Array.isArray(first?.categories) ? first.categories : [];
}
