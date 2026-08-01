import type { CacheCategory, PublicContentItem } from "@/types/public-content";
import type { StoredMediaPreview } from "@/types/media-detail";

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseMediaTitle(value: string): { title: string; year: string } {
  const year = value.match(/(?:^|\D)((?:19|20)\d{2})(?:\D|$)/)?.[1] || "";
  const title = value
    .replace(/^(?:EX|NF|EN|-?DE)\s*-\s*/i, "")
    .replace(/\((?:19|20)\d{2}\)/g, "")
    .replace(/\((?:[A-Z]{2}|MULTI)\)$/i, "")
    .replace(/\b(?:4K|UHD|FHD)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return { title: title || value.trim(), year };
}

export function mediaSlug(title: string, year: string): string {
  const normalized = `${title}-${year}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
  return normalized || "titel";
}

export function buildMediaDetail(
  kind: Exclude<CacheCategory, "live">,
  item: PublicContentItem,
  category: string,
  image: string,
): { href: string; storageKey: string; preview: StoredMediaPreview } {
  const rawTitle = text(item.name) || text(item.title) || text(item.series_name) || "Titel";
  const parsed = parseMediaTitle(rawTitle);
  const slug = mediaSlug(parsed.title, parsed.year);
  const section = kind === "vod" ? "filme" : "serien";
  const query = new URLSearchParams({ title: parsed.title });
  if (parsed.year) query.set("year", parsed.year);

  return {
    href: `/${section}/${slug}?${query.toString()}`,
    storageKey: `kanalista_detail_${kind}_${slug}`,
    preview: {
      title: rawTitle,
      image,
      plot: text(item.plot),
      genre: text(item.genre),
      rating: typeof item.rating === "number" ? item.rating.toFixed(1) : text(item.rating),
      releaseDate: text(item.releaseDate) || text(item.release_date),
      category,
    },
  };
}

export function storeMediaPreview(storageKey: string, preview: StoredMediaPreview): void {
  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(preview));
  } catch {
    // Detailseite funktioniert weiterhin ueber TMDB.
  }
}
