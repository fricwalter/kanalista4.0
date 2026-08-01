"use client";

/* eslint-disable @next/next/no-img-element */
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/app/_components/language-context";
import { getCached, setCache } from "@/lib/cache";
import { getChannelImageUrl } from "@/lib/channel-image";
import type { CacheCategory, PublicCategory, PublicContentItem } from "@/types/public-content";

type BrowserProps = {
  kind: CacheCategory;
  channelCount: number;
  initialCategories: PublicCategory[];
};

const PAGE_SIZE = 120;

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
    safeText(item.stream_name)
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
  return getChannelImageUrl(image);
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
  channelCount,
  initialCategories,
}: BrowserProps) {
  const { copy } = useLanguage();
  const keys = CACHE_KEYS[kind];
  const [items, setItems] = useState<PublicContentItem[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>(initialCategories);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("alle");
  const [regionFilter, setRegionFilter] = useState<"all" | "exyu" | "de">("all");
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
  }, [activeCategory, regionFilter, search]);

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
      const regionPriority = getRegionPriority(`${categoryName} ${getDisplayName(item)}`);
      const matchesRegion =
        kind !== "live" ||
        regionFilter === "all" ||
        (regionFilter === "exyu" && regionPriority === 0) ||
        (regionFilter === "de" && regionPriority === 1);
      const matchesSearch =
        q.length === 0 ||
        getDisplayName(item).toLowerCase().includes(q) ||
        categoryName.toLowerCase().includes(q) ||
        getGenre(item).toLowerCase().includes(q);
      return matchesCategory && matchesRegion && matchesSearch;
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
  }, [activeCategory, categoryMap, items, kind, regionFilter, search]);

  const visibleItems = useMemo(
    () => filteredItems.slice(0, visibleCount),
    [filteredItems, visibleCount]
  );

  const title = kind === "live" ? copy.catalog.liveTitle : kind === "vod" ? copy.catalog.moviesTitle : copy.catalog.seriesTitle;
  const unit = kind === "live" ? copy.catalog.liveUnit : kind === "vod" ? copy.catalog.moviesUnit : copy.catalog.seriesUnit;
  const description = `${copy.catalog.publicOverview}: ${channelCount.toLocaleString("de-DE")} ${unit}.`;

  return (
    <main className="catalog-page">
      <div className="catalog-shell">
        <header className="catalog-intro">
          <div>
            <p className="catalog-eyebrow">Kanalista 4.0</p>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <span
            className={`catalog-total${loading ? " catalog-total--loading" : ""}`}
            aria-live="polite"
            aria-busy={loading}
            role="status"
          >
            {loading ? copy.catalog.loading : `${filteredItems.length.toLocaleString("de-DE")} ${copy.catalog.results}`}
          </span>
        </header>

        <section className="catalog-controls" aria-label={copy.catalog.filterChannels}>
          <label className="catalog-search">
            <Search aria-hidden="true" size={19} strokeWidth={2.2} />
            <span className="sr-only">{copy.catalog.search}</span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={copy.catalog.searchPlaceholder}
            />
          </label>

          <div className="catalog-filter-row">
            {kind === "live" && (
              <div className="region-switch" aria-label={copy.catalog.chooseRegion}>
                {(
                  [
                    ["all", copy.catalog.all],
                    ["exyu", "EXYU"],
                    ["de", "DE"],
                  ] as const
                ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={regionFilter === value}
                  onClick={() => {
                    setRegionFilter(value);
                    setActiveCategory("alle");
                  }}
                >
                  {label}
                </button>
                ))}
              </div>
            )}

            <label className="category-select">
              <span>{copy.catalog.category}</span>
              <select
                value={activeCategory}
                onChange={(event) => {
                  setActiveCategory(event.target.value);
                  setRegionFilter("all");
                }}
              >
                <option value="alle">{copy.catalog.allCategories}</option>
                {orderedCategories.map((category) => (
                  <option key={String(category.category_id)} value={String(category.category_id)}>
                    {category.category_name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="channel-grid" aria-busy={loading}>
          {visibleItems.map((item, index) => {
            const name = getDisplayName(item) || copy.catalog.unknownTitle;
            const categoryName = categoryMap.get(getCategoryId(item)) || copy.catalog.withoutCategory;
            const genre = getGenre(item);
            const rating = getRating(item);
            const image = getImage(item, kind);

            return (
              <article key={`${name}-${index}`} className="channel-card">
                <div className="channel-card__media">
                  {image ? (
                    <img src={image} alt="" loading="lazy" />
                  ) : (
                    <span aria-hidden="true">TV</span>
                  )}
                </div>
                <div className="channel-card__body">
                  <h2>{name}</h2>
                  <p className="channel-card__category">{categoryName}</p>
                  {kind !== "live" && genre && <p className="channel-card__meta">{genre}</p>}
                  {kind === "series" && rating && (
                    <p className="channel-card__rating">★ {rating}</p>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        {!loading && visibleItems.length < filteredItems.length && (
          <div className="catalog-more">
            <button
              type="button"
              onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
              className="primary-button"
            >
              {copy.catalog.showMore} {Math.min(PAGE_SIZE, filteredItems.length - visibleItems.length)} {copy.catalog.showMoreSuffix}
            </button>
          </div>
        )}

        {loadError && (
          <div className="catalog-message catalog-message--error">{copy.catalog.loadError}</div>
        )}

        {!loading && !loadError && filteredItems.length === 0 && (
          <div className="catalog-message">
            {copy.catalog.empty}
          </div>
        )}
      </div>
    </main>
  );
}
