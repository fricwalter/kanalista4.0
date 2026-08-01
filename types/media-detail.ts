export type TmdbMediaKind = "movie" | "tv";

export type MediaDetails = {
  id: number;
  title: string;
  originalTitle: string;
  overview: string;
  tagline: string;
  posterUrl: string;
  backdropUrl: string;
  rating: number;
  releaseDate: string;
  genres: string[];
  runtime: number | null;
  seasons: number | null;
  cast: string[];
  director: string;
  imdbId: string;
};

export type StoredMediaPreview = {
  title: string;
  image: string;
  plot: string;
  genre: string;
  rating: string;
  releaseDate: string;
  category: string;
};
