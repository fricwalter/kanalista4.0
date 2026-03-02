"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

const KIND_LABEL: Record<CacheCategory, string> = {
  live: "Live",
  vod: "Filme",
  series: "Serien",
};

function safeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getName(item: PublicContentItem): string {
  return (
    safeText(item.name) ||
    safeText(item.title) ||
    safeText(item.series_name) ||
    safeText(item.stream_name) ||
    "Unbekannter Titel"
  );
}

function getCategoryId(item: PublicContentItem): string {
  if (typeof item.category_id === "number") return String(item.category_id);
  if (typeof item.category_id === "string") return item.category_id;
  return "";
}

function getImage(item: PublicContentItem): string {
  return safeText(item.cover) || safeText(item.stream_icon) || safeText(item.thumbnail) || "";
}

function getGenre(item: PublicContentItem): string {
  return safeText(item.genre);
}

function getRating(item: PublicContentItem): string {
  if (typeof item.rating === "number") return item.rating.toFixed(1);
  if (typeof item.rating === "string") return item.rating;
  return "";
}

async function fetchChannelData(kind: CacheCategory): Promise<PublicContentItem[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const params = new URLSearchParams({
    select: "data,fetched_at",
    category: `eq.${kind}`,
    order: "fetched_at.desc",
    limit: "1",
  });

  const res = await fetch(`${url}/rest/v1/channel_cache?${params.toString()}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) return [];
  const rows = (await res.json()) as Array<{ data: PublicContentItem[] | null }>;
  return Array.isArray(rows[0]?.data) ? rows[0].data : [];
}

async function fetchCategories(kind: CacheCategory): Promise<PublicCategory[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const params = new URLSearchParams({
    select: "categories,fetched_at",
    type: `eq.${kind}`,
    order: "fetched_at.desc",
    limit: "1",
  });

  const res = await fetch(`${url}/rest/v1/categories_cache?${params.toString()}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) return [];
  const rows = (await res.json()) as Array<{ categories: PublicCategory[] | null }>;
  return Array.isArray(rows[0]?.categories) ? rows[0].categories : [];
}

export default function SuchePage() {
  const [itemsByKind, setItemsByKind] = useState<Record<CacheCategory, PublicContentItem[]>>({
    live: [],
    vod: [],
    series: [],
  });
  const [categoriesByKind, setCategoriesByKind] = useState<Record<CacheCategory, PublicCategory[]>>({
    live: [],
    vod: [],
    series: [],
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      const kinds: CacheCategory[] = ["live", "vod", "series"];
      const nextItems: Record<CacheCategory, PublicContentItem[]> = { live: [], vod: [], series: [] };
      const nextCategories: Record<CacheCategory, PublicCategory[]> = {
        live: [],
        vod: [],
        series: [],
      };

      await Promise.all(
        kinds.map(async (kind) => {
          const keys = CACHE_KEYS[kind];
          const cachedItems = getCached<PublicContentItem[]>(keys.items);
          const cachedCategories = getCached<PublicCategory[]>(keys.categories);

          if (cachedItems && cachedItems.length > 0) {
            nextItems[kind] = cachedItems;
          } else {
            const fetchedItems = await fetchChannelData(kind);
            nextItems[kind] = fetchedItems;
            setCache(keys.items, fetchedItems);
          }

          if (cachedCategories && cachedCategories.length > 0) {
            nextCategories[kind] = cachedCategories;
          } else {
            const fetchedCategories = await fetchCategories(kind);
            nextCategories[kind] = fetchedCategories;
            setCache(keys.categories, fetchedCategories);
          }
        })
      );

      if (!cancelled) {
        setItemsByKind(nextItems);
        setCategoriesByKind(nextCategories);
        setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const groupedResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    const groups: Record<CacheCategory, SearchEntry[]> = { live: [], vod: [], series: [] };
    const kinds: CacheCategory[] = ["live", "vod", "series"];

    kinds.forEach((kind) => {
      const categoryMap = new Map<string, string>();
      categoriesByKind[kind].forEach((category) => {
        categoryMap.set(String(category.category_id), category.category_name);
      });

      groups[kind] = itemsByKind[kind]
        .map((item): SearchEntry => {
          const categoryName = categoryMap.get(getCategoryId(item)) || "Ohne Kategorie";
          return {
            kind,
            name: getName(item),
            categoryName,
            genre: getGenre(item),
            rating: getRating(item),
            image: getImage(item),
          };
        })
        .filter((entry) => {
          if (!query) return true;
          return (
            entry.name.toLowerCase().includes(query) ||
            entry.categoryName.toLowerCase().includes(query) ||
            entry.genre.toLowerCase().includes(query)
          );
        });
    });

    return groups;
  }, [categoriesByKind, itemsByKind, search]);

  const total = groupedResults.live.length + groupedResults.vod.length + groupedResults.series.length;

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="glass-card p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Kanalista 4.0</p>
              <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">Globale Suche</h1>
              <p className="mt-2 text-sm text-gray-300">
                Suche gleichzeitig in Live-Kanaelen, Filmen und Serien.
              </p>
            </div>
            <nav className="flex flex-wrap gap-2">
              <Link href="/" className="glass-button rounded-lg px-4 py-2 text-sm">
                Start
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
            </nav>
          </div>
        </header>

        <section className="glass-card p-4 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nach Titel, Kategorie oder Genre suchen..."
              className="glass-input w-full md:max-w-lg"
            />
            <p className="text-sm text-gray-300">{loading ? "Lade Daten..." : `${total} Treffer`}</p>
          </div>
        </section>

        {(["live", "vod", "series"] as CacheCategory[]).map((kind) => (
          <section key={kind} className="glass-card p-4 md:p-6">
            <h2 className="text-xl font-semibold text-white">
              {KIND_LABEL[kind]} ({groupedResults[kind].length})
            </h2>

            <div className="mt-4 channel-grid">
              {groupedResults[kind].map((entry, index) => (
                <article key={`${entry.kind}-${entry.name}-${index}`} className="glass-card-hover p-3">
                  {entry.image ? (
                    <img
                      src={entry.image}
                      alt={entry.name}
                      loading="lazy"
                      className="h-36 w-full rounded-lg border border-white/10 object-cover"
                    />
                  ) : (
                    <div className="flex h-36 w-full items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs text-gray-400">
                      Kein Bild
                    </div>
                  )}
                  <h3 className="mt-3 line-clamp-2 text-sm font-semibold text-white">{entry.name}</h3>
                  <p className="mt-1 inline-block rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-200">
                    {entry.categoryName}
                  </p>
                  {entry.genre && <p className="mt-2 line-clamp-1 text-xs text-gray-300">Genre: {entry.genre}</p>}
                  {kind === "series" && entry.rating && (
                    <p className="mt-1 text-xs text-yellow-300">Bewertung: {entry.rating}</p>
                  )}
                </article>
              ))}
            </div>

            {groupedResults[kind].length === 0 && (
              <p className="mt-4 text-sm text-gray-300">Keine Treffer in dieser Kategorie.</p>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
