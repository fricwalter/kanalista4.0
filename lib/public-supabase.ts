import type { CacheCategory, PublicCategory, PublicContentItem } from "@/types/public-content";

export const WEEK_REVALIDATE_SECONDS = 604800;

type ChannelCacheResponse = {
  data: PublicContentItem[] | null;
  channel_count: number | null;
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

export async function getPublicChannelData(category: CacheCategory): Promise<{
  items: PublicContentItem[];
  count: number;
}> {
  const query = new URLSearchParams({
    select: "data,channel_count,fetched_at",
    category: `eq.${category}`,
    order: "fetched_at.desc",
    limit: "1",
  });

  const rows = await fetchPublicRows<ChannelCacheResponse>(`channel_cache?${query.toString()}`);
  const first = rows[0];
  const items = Array.isArray(first?.data) ? first.data : [];
  const count = typeof first?.channel_count === "number" ? first.channel_count : items.length;

  return { items, count };
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

