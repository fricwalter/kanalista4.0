/**
 * Xtream Codes API Wrapper
 * Alle API-Calls laufen server-seitig.
 */

export interface XtreamUserInfo {
  user_id: number;
  username: string;
  password: string;
  message: string;
  auth: number;
  status: string;
  exp_date: string;
  is_trial: number;
  active_cons: number;
  created_at: string;
  max_connections: number;
}

export interface XtreamCategory {
  category_id: string;
  category_name: string;
  parent_id?: number;
}

export interface XtreamStream {
  num: number;
  name: string;
  stream_id: number;
  stream_type: string;
  stream_icon: string;
  rating: number;
  rating_count: number;
  added: string;
  category_id: string;
  custom_sid: string;
  container_extension: string;
  direct_source: string;
  force_name?: string;
  thumbnail?: string;
}

export interface XtreamSeries {
  series_id: number;
  name: string;
  cover: string;
  plot: string;
  cast: string;
  director: string;
  genre: string;
  releaseDate: string;
  rating: string;
  rating_count: number;
  backdrop_path: string[];
  youtube_trailer: string;
  episode_run_time: string;
  category_id: string;
}

export class XtreamAPI {
  private baseDns: string;

  constructor(
    private dns: string,
    private username: string,
    private password: string
  ) {
    const cleanDns = dns.trim().replace(/\/+$/, "");
    this.baseDns = /^https?:\/\//i.test(cleanDns)
      ? cleanDns
      : `http://${cleanDns}`;
  }

  private buildUrl(action?: string, params?: Record<string, string>): string {
    const url = new URL(`${this.baseDns}/player_api.php`);
    url.searchParams.set("username", this.username);
    url.searchParams.set("password", this.password);
    if (action) {
      url.searchParams.set("action", action);
    }
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }
    return url.toString();
  }

  private mapUpstreamError(status: number, body: string): string {
    const cf = body.match(/(?:error code[:\s]*|Error\s+)(\d{3})/i)?.[1];

    if (cf === "1016") {
      return "Xtream DNS konnte nicht aufgeloest werden (Cloudflare 1016). Bitte DNS/Host pruefen.";
    }
    if (cf === "521") {
      return "Xtream Server nicht erreichbar (Cloudflare 521). Bitte Server/Port pruefen.";
    }
    if (cf === "522") {
      return "Xtream Server-Timeout (Cloudflare 522). Bitte Server/Port pruefen.";
    }

    if (status >= 500) {
      return "Xtream Server momentan nicht erreichbar.";
    }
    if (status >= 400) {
      return "Xtream Anfrage wurde abgelehnt.";
    }

    return body.slice(0, 180) || "Unbekannte Antwort vom Xtream Server.";
  }

  private async request<T>(action?: string, params?: Record<string, string>): Promise<T> {
    const url = this.buildUrl(action, params);
    let res: Response;

    try {
      res = await fetch(url, {
        headers: {
          accept: "application/json,text/plain,*/*",
        },
      });
    } catch {
      throw new Error("Verbindung zum Xtream Server fehlgeschlagen.");
    }

    const raw = await res.text();
    let data: unknown = null;

    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        if (!res.ok) {
          throw new Error(this.mapUpstreamError(res.status, raw));
        }
        throw new Error(this.mapUpstreamError(502, raw));
      }
    }

    if (!res.ok) {
      throw new Error(this.mapUpstreamError(res.status, raw));
    }

    return data as T;
  }

  async validateLogin(): Promise<XtreamUserInfo> {
    const data = await this.request<{ user_info?: XtreamUserInfo; message?: string }>();

    if (!data.user_info) {
      throw new Error(data.message || "Ungueltige Xtream Zugangsdaten");
    }

    return data.user_info;
  }

  async getLiveCategories(): Promise<XtreamCategory[]> {
    return this.request<XtreamCategory[]>("get_live_categories");
  }

  async getLiveStreams(categoryId?: string): Promise<XtreamStream[]> {
    return this.request<XtreamStream[]>(
      "get_live_streams",
      categoryId ? { category_id: categoryId } : undefined
    );
  }

  async getVodCategories(): Promise<XtreamCategory[]> {
    return this.request<XtreamCategory[]>("get_vod_categories");
  }

  async getVodStreams(categoryId?: string): Promise<XtreamStream[]> {
    return this.request<XtreamStream[]>(
      "get_vod_streams",
      categoryId ? { category_id: categoryId } : undefined
    );
  }

  async getSeriesCategories(): Promise<XtreamCategory[]> {
    return this.request<XtreamCategory[]>("get_series_categories");
  }

  async getAllSeries(categoryId?: string): Promise<XtreamSeries[]> {
    return this.request<XtreamSeries[]>(
      "get_series",
      categoryId ? { category_id: categoryId } : undefined
    );
  }

  async getSeriesInfo(seriesId: number): Promise<any> {
    return this.request<any>("get_series_info", {
      series_id: String(seriesId),
    });
  }

  getStreamUrl(streamId: number, extension: string = "m3u8"): string {
    const cleanDns = this.baseDns.replace(/\/$/, "");
    return `${cleanDns}/${streamId}.${extension}`;
  }
}

export function createXtreamAPI(dns: string, username: string, password: string): XtreamAPI {
  return new XtreamAPI(dns, username, password);
}