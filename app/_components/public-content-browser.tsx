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
  initialItems: PublicContentItem[];
  initialCategories: PublicCategory[];
};

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
  if (kind === "series") {
    return safeText(item.cover) || safeText(item.stream_icon) || "";
  }
  return safeText(item.stream_icon) || safeText(item.thumbnail) || safeText(item.cover) || "";
}

function getGenre(item: PublicContentItem): string {
  return safeText(item.genre);
}

function getRating(item: PublicContentItem): string {
  if (typeof item.rating === "number") return item.rating.toFixed(1);
  if (typeof item.rating === "string") return item.rating;
  return "";
}

export default function PublicContentBrowser({
  kind,
  title,
  description,
  initialItems,
  initialCategories,
}: BrowserProps) {
  const keys = CACHE_KEYS[kind];
  const [items, setItems] = useState<PublicContentItem[]>(initialItems);
  const [categories, setCategories] = useState<PublicCategory[]>(initialCategories);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("alle");

  useEffect(() => {
    const cachedItems = getCached<PublicContentItem[]>(keys.items);
    if (cachedItems && cachedItems.length > 0) {
      setItems(cachedItems);
    } else {
      setCache(keys.items, initialItems);
    }

    const cachedCategories = getCached<PublicCategory[]>(keys.categories);
    if (cachedCategories && cachedCategories.length > 0) {
      setCategories(cachedCategories);
    } else {
      setCache(keys.categories, initialCategories);
    }
  }, [initialCategories, initialItems, keys.categories, keys.items]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((category) => {
      map.set(String(category.category_id), category.category_name);
    });
    return map;
  }, [categories]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const itemCategoryId = getCategoryId(item);
      const categoryName = categoryMap.get(itemCategoryId) || "";
      const matchesCategory =
        activeCategory === "alle" || itemCategoryId === activeCategory;
      const matchesSearch =
        q.length === 0 ||
        getDisplayName(item).toLowerCase().includes(q) ||
        categoryName.toLowerCase().includes(q) ||
        getGenre(item).toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, categoryMap, items, search]);

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
              {filteredItems.length} von {items.length} Eintraegen
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
            {categories.map((category) => {
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
          {filteredItems.map((item, index) => {
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

        {filteredItems.length === 0 && (
          <div className="glass-card p-8 text-center text-sm text-gray-300">
            Keine Eintraege fuer die aktuelle Suche gefunden.
          </div>
        )}
      </div>
    </main>
  );
}

