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
  plot?: string | null;
  cast?: string | null;
  director?: string | null;
  releaseDate?: string | null;
  release_date?: string | null;
  episode_run_time?: string | null;
  title?: string | null;
  series_name?: string | null;
  stream_name?: string | null;
}
