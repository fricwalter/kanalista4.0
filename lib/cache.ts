const CACHE_VERSION = "2.0";
const TTL = 7 * 24 * 60 * 60 * 1000; // 7 Tage

export function getCached<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`kanalista_${key}`);
    if (!raw) return null;
    const { data, timestamp, version } = JSON.parse(raw) as {
      data: unknown;
      timestamp: number;
      version: string;
    };
    if (version !== CACHE_VERSION || Date.now() - timestamp > TTL) {
      localStorage.removeItem(`kanalista_${key}`);
      return null;
    }
    return data as T;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `kanalista_${key}`,
      JSON.stringify({
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION,
      })
    );
  } catch {
    // localStorage voll
  }
}

export function clearCache(): void {
  if (typeof window === "undefined") return;
  ["live_channels", "vod_channels", "series", "live_cats", "vod_cats", "series_cats"].forEach(
    (k) => localStorage.removeItem(`kanalista_${k}`)
  );
}

