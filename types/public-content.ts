export type CacheCategory = "live" | "vod" | "series";

export interface PublicCategory {
  category_id: string;
  category_name: string;
  parent_id?: number | null;
}

export interface PublicContentItem {
  [key: string]: unknown;
  category_id?: string | number | null;
  name?: string | null;
  stream_icon?: string | null;
  thumbnail?: string | null;
  cover?: string | null;
  genre?: string | null;
  rating?: string | number | null;
}

