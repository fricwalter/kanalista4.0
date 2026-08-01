"use client";

/* eslint-disable @next/next/no-img-element */
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/app/_components/language-context";
import { getCached, setCache } from "@/lib/cache";
import type { CacheCategory, PublicCategory, PublicContentItem } from "@/types/public-content";

type SearchEntry = {
  kind: CacheCategory;
  name: string;
  categoryName: string;
  genre: string;
  rating: string;
  image: string;
};

const CACHE_KEYS = {
  live: { items: "live_channels", categories: "live_cats" },
  vod: { items: "vod_channels", categories: "vod_cats" },
  series: { items: "series", categories: "series_cats" },
} as const;

function safeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getName(item: PublicContentItem): string {
  return safeText(item.name) || safeText(item.title) || safeText(item.series_name) || safeText(item.stream_name);
}

function getCategoryId(item: PublicContentItem): string {
  return typeof item.category_id === "number" || typeof item.category_id === "string"
    ? String(item.category_id) : "";
}

function getImage(item: PublicContentItem): string {
  const image = safeText(item.cover) || safeText(item.stream_icon) || safeText(item.thumbnail);
  if (image.startsWith("//")) return `https:${image}`;
  return image.startsWith("https://") || image.startsWith("data:image/") ? image : "";
}

async function fetchChannelData(kind: CacheCategory): Promise<PublicContentItem[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  const params = new URLSearchParams({ select: "data,fetched_at", category: `eq.${kind}`, order: "fetched_at.desc", limit: "1" });
  const res = await fetch(`${url}/rest/v1/channel_cache?${params}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  });
  if (!res.ok) return [];
  const rows = (await res.json()) as Array<{ data: PublicContentItem[] | null }>;
  return Array.isArray(rows[0]?.data) ? rows[0].data : [];
}

async function fetchCategories(kind: CacheCategory): Promise<PublicCategory[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  const params = new URLSearchParams({ select: "categories,fetched_at", type: `eq.${kind}`, order: "fetched_at.desc", limit: "1" });
  const res = await fetch(`${url}/rest/v1/categories_cache?${params}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  });
  if (!res.ok) return [];
  const rows = (await res.json()) as Array<{ categories: PublicCategory[] | null }>;
  return Array.isArray(rows[0]?.categories) ? rows[0].categories : [];
}

export default function SuchePage() {
  const { copy, locale } = useLanguage();
  const [itemsByKind, setItemsByKind] = useState<Record<CacheCategory, PublicContentItem[]>>({ live: [], vod: [], series: [] });
  const [categoriesByKind, setCategoriesByKind] = useState<Record<CacheCategory, PublicCategory[]>>({ live: [], vod: [], series: [] });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const kinds: CacheCategory[] = ["live", "vod", "series"];
      const nextItems: Record<CacheCategory, PublicContentItem[]> = { live: [], vod: [], series: [] };
      const nextCategories: Record<CacheCategory, PublicCategory[]> = { live: [], vod: [], series: [] };
      await Promise.all(kinds.map(async (kind) => {
        const keys = CACHE_KEYS[kind];
        const cachedItems = getCached<PublicContentItem[]>(keys.items);
        const cachedCategories = getCached<PublicCategory[]>(keys.categories);
        nextItems[kind] = cachedItems?.length ? cachedItems : await fetchChannelData(kind);
        nextCategories[kind] = cachedCategories?.length ? cachedCategories : await fetchCategories(kind);
        if (!cachedItems?.length) setCache(keys.items, nextItems[kind]);
        if (!cachedCategories?.length) setCache(keys.categories, nextCategories[kind]);
      }));
      if (!cancelled) {
        setItemsByKind(nextItems);
        setCategoriesByKind(nextCategories);
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const groupedResults = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(locale);
    const groups: Record<CacheCategory, SearchEntry[]> = { live: [], vod: [], series: [] };
    (["live", "vod", "series"] as CacheCategory[]).forEach((kind) => {
      const categoryMap = new Map(categoriesByKind[kind].map((category) => [String(category.category_id), category.category_name]));
      groups[kind] = itemsByKind[kind].map((item) => ({
        kind,
        name: getName(item) || copy.catalog.unknownTitle,
        categoryName: categoryMap.get(getCategoryId(item)) || copy.catalog.withoutCategory,
        genre: safeText(item.genre),
        rating: typeof item.rating === "number" ? item.rating.toFixed(1) : safeText(item.rating),
        image: getImage(item),
      })).filter((entry) => query.length >= 2 && [entry.name, entry.categoryName, entry.genre]
        .some((value) => value.toLocaleLowerCase(locale).includes(query))).slice(0, 120);
    });
    return groups;
  }, [categoriesByKind, copy.catalog.unknownTitle, copy.catalog.withoutCategory, itemsByKind, locale, search]);

  const total = groupedResults.live.length + groupedResults.vod.length + groupedResults.series.length;
  const hasQuery = search.trim().length >= 2;

  return (
    <main className="catalog-page">
      <div className="catalog-shell">
        <section className="catalog-intro">
          <div><p className="catalog-eyebrow">Kanalista 4.0</p><h1>{copy.globalSearch.title}</h1></div>
          <span className="catalog-total">{loading ? copy.catalog.loading : `${total.toLocaleString(locale)} ${copy.catalog.results}`}</span>
        </section>

        <section className="catalog-controls search-page-controls">
          <label className="catalog-search">
            <Search size={19} aria-hidden="true" />
            <input autoFocus type="search" value={search} onChange={(event) => setSearch(event.target.value)}
              placeholder={copy.globalSearch.placeholder} />
          </label>
          <p className="search-hint">{hasQuery ? copy.globalSearch.maxResults : copy.globalSearch.minChars}</p>
        </section>

        {hasQuery && (["live", "vod", "series"] as CacheCategory[]).map((kind) => (
          <section key={kind} className="search-results-section">
            <div className="results-heading"><h2>{kind === "live" ? copy.nav.live : kind === "vod" ? copy.nav.movies : copy.nav.series}</h2><span>{groupedResults[kind].length}</span></div>
            <div className="channel-grid">
              {groupedResults[kind].map((entry, index) => (
                <article key={`${entry.kind}-${entry.name}-${index}`} className="channel-card">
                  <div className="channel-card__media">
                    {entry.image ? <img src={entry.image} alt="" loading="lazy" /> : <span>{kind === "series" ? "S" : kind === "vod" ? "F" : "TV"}</span>}
                  </div>
                  <div className="channel-card__body">
                    <h2>{entry.name}</h2>
                    <p className="channel-card__category">{entry.categoryName}</p>
                    {entry.genre && <p className="channel-card__meta">{entry.genre}</p>}
                    {kind === "series" && entry.rating && <p className="channel-card__rating">{copy.catalog.rating} {entry.rating}</p>}
                  </div>
                </article>
              ))}
            </div>
            {!loading && groupedResults[kind].length === 0 && <p className="catalog-message">{copy.globalSearch.noResults}</p>}
          </section>
        ))}
      </div>
    </main>
  );
}
