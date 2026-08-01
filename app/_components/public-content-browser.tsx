"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCached, setCache } from "@/lib/cache";
import type { CacheCategory, PublicCategory, PublicContentItem } from "@/types/public-content";

type BrowserProps = {
  kind: CacheCategory;
  title: string;
  description: string;
  initialCategories: PublicCategory[];
};

const PAGE_SIZE = 240;

const CACHE_KEYS = {
  live: { items: "live_channels", categories: "live_cats" },
  vod: { items: "vod_channels", categories: "vod_cats" },
  series: { items: "series", categories: "series_cats" },
} as const;

function safeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getDisplayName(item: PublicContentItem): string {
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

function getImage(item: PublicContentItem, kind: CacheCategory): string {
  const image =
    kind === "series"
      ? safeText(item.cover) || safeText(item.stream_icon)
      : safeText(item.stream_icon) || safeText(item.thumbnail) || safeText(item.cover);
  if (image.startsWith("//")) return `https:${image}`;
  return image.startsWith("https://") || image.startsWith("data:image/") ? image : "";
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
  if (!url || !key) throw new Error("Supabase-Konfiguration fehlt");

  const query = new URLSearchParams({
    select: "data",
    category: `eq.${kind}`,
    order: "fetched_at.desc",
    limit: "1",
  });
  const response = await fetch(`${url}/rest/v1/channel_cache?${query.toString()}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) throw new Error(`Daten konnten nicht geladen werden (${response.status})`);
  const rows = (await response.json()) as Array<{ data: PublicContentItem[] | null }>;
  return Array.isArray(rows[0]?.data) ? rows[0].data : [];
}

const EXYU_MARKERS = [
  "exyu",
  "ex yu",
  "balkan",
  "bosna",
  "bosnia",
  "bih",
  "hrvats",
  "croat",
  "srb",
  "serb",
  "sloven",
  "makedon",
  "macedon",
  "crna gora",
  "montenegro",
  "kosov",
];

const GERMAN_MARKERS = ["deutsch", "german", "njemack", "dach"];

function normalizeRegionText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_|:[\](){}-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getRegionPriority(value: string): number {
  const normalized = normalizeRegionText(value);
  if (EXYU_MARKERS.some((marker) => normalized.includes(marker))) return 0;
  if (
    GERMAN_MARKERS.some((marker) => normalized.includes(marker)) ||
    /(^|\s)(de|ger)(\s|$)/.test(normalized)
  ) {
    return 1;
  }
  return 2;
}

export default function PublicContentBrowser({
  kind,
  title,
  description,
  initialCategories,
}: BrowserProps) {
  const keys = CACHE_KEYS[kind];
  const [items, setItems] = useState<PublicContentItem[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>(initialCategories);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("alle");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const cachedItems = getCached<PublicContentItem[]>(keys.items);
    if (cachedItems && cachedItems.length > 0) {
      setItems(cachedItems);
      setLoading(false);
    } else {
      fetchChannelData(kind)
        .then((freshItems) => {
          if (cancelled) return;
          setItems(freshItems);
          setCache(keys.items, freshItems);
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          setLoadError(error instanceof Error ? error.message : "Daten konnten nicht geladen werden");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    const cachedCategories = getCached<PublicCategory[]>(keys.categories);
    if (cachedCategories && cachedCategories.length > 0) {
      setCategories(cachedCategories);
    } else {
      setCache(keys.categories, initialCategories);
    }
    return () => {
      cancelled = true;
    };
  }, [initialCategories, keys.categories, keys.items, kind]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeCategory, search]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((category) => {
      map.set(String(category.category_id), category.category_name);
    });
    return map;
  }, [categories]);

  const orderedCategories = useMemo(() => {
    if (kind !== "live") return categories;
    return categories
      .map((category, index) => ({ category, index }))
      .sort((a, b) => {
        const priorityDifference =
          getRegionPriority(a.category.category_name) - getRegionPriority(b.category.category_name);
        return priorityDifference || a.index - b.index;
      })
      .map(({ category }) => category);
  }, [categories, kind]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matchingItems = items.filter((item) => {
      const itemCategoryId = getCategoryId(item);
      const categoryName = categoryMap.get(itemCategoryId) || "";
      const matchesCategory = activeCategory === "alle" || itemCategoryId === activeCategory;
      const matchesSearch =
        q.length === 0 ||
        getDisplayName(item).toLowerCase().includes(q) ||
        categoryName.toLowerCase().includes(q) ||
        getGenre(item).toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });

    if (kind !== "live") return matchingItems;

    return matchingItems
      .map((item, index) => ({ item, index }))
      .sort((a, b) => {
        const aCategory = categoryMap.get(getCategoryId(a.item)) || "";
        const bCategory = categoryMap.get(getCategoryId(b.item)) || "";
        const aPriority = getRegionPriority(`${aCategory} ${getDisplayName(a.item)}`);
        const bPriority = getRegionPriority(`${bCategory} ${getDisplayName(b.item)}`);
        return aPriority - bPriority || a.index - b.index;
      })
      .map(({ item }) => item);
  }, [activeCategory, categoryMap, items, kind, search]);

  const visibleItems = useMemo(
    () => filteredItems.slice(0, visibleCount),
    [filteredItems, visibleCount]
  );

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="glass-card p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Kanalista 4.0</p>
              <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">{title}</h1>
              <p className="mt-2 text-sm text-gray-300 md:text-base">{description}</p>
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
              <Link href="/suche" className="glass-button-primary rounded-lg px-4 py-2 text-sm">
                Suche
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
            <p className="text-sm text-gray-300">
              {loading ? "Daten werden geladen..." : `${filteredItems.length} von ${items.length} Eintraegen`}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory("alle")}
              className={`rounded-lg border px-3 py-1 text-sm transition ${
                activeCategory === "alle"
                  ? "border-violet-300 bg-violet-500/20 text-white"
                  : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
              }`}
            >
              Alle Kategorien
            </button>
            {orderedCategories.map((category) => {
              const id = String(category.category_id);
              const selected = activeCategory === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveCategory(id)}
                  className={`rounded-lg border px-3 py-1 text-sm transition ${
                    selected
                      ? "border-violet-300 bg-violet-500/20 text-white"
                      : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  {category.category_name}
                </button>
              );
            })}
          </div>
        </section>

        <section className="channel-grid">
          {visibleItems.map((item, index) => {
            const name = getDisplayName(item);
            const categoryName = categoryMap.get(getCategoryId(item)) || "Ohne Kategorie";
            const genre = getGenre(item);
            const rating = getRating(item);
            const image = getImage(item, kind);

            return (
              <article key={`${name}-${index}`} className="glass-card-hover p-3">
                {image ? (
                  <img
                    src={image}
                    alt={name}
                    loading="lazy"
                    className="h-36 w-full rounded-lg border border-white/10 object-cover"
                  />
                ) : (
                  <div className="flex h-36 w-full items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs text-gray-400">
                    Kein Bild
                  </div>
                )}

                <h2 className="mt-3 line-clamp-2 text-sm font-semibold text-white">{name}</h2>

                <p className="mt-1 inline-block rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-200">
                  {categoryName}
                </p>

                {kind !== "live" && genre && (
                  <p className="mt-2 line-clamp-1 text-xs text-gray-300">Genre: {genre}</p>
                )}
                {kind === "series" && rating && (
                  <p className="mt-1 text-xs text-yellow-300">Bewertung: {rating}</p>
                )}
              </article>
            );
          })}
        </section>

        {!loading && visibleItems.length < filteredItems.length && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
              className="glass-button-primary rounded-lg px-5 py-2.5 text-sm"
            >
              Weitere {Math.min(PAGE_SIZE, filteredItems.length - visibleItems.length)} anzeigen
            </button>
          </div>
        )}

        {loadError && (
          <div className="glass-card p-6 text-center text-sm text-red-200">{loadError}</div>
        )}

        {!loading && !loadError && filteredItems.length === 0 && (
          <div className="glass-card p-8 text-center text-sm text-gray-300">
            Keine Eintraege fuer die aktuelle Suche gefunden.
          </div>
        )}
      </div>
    </main>
  );
}
