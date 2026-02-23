/**
 * Xtream Codes API Wrapper
 * Alle API-Calls laufen Server-seitig - Credentials werden NIEMALS an den Browser gesendet
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
  private base: string;

  constructor(private dns: string, private username: string, private password: string) {
    // Entferne trailing slash von DNS
    const cleanDns = dns.replace(/\/$/, '');
    this.base = `${cleanDns}/player_api.php?username=${username}&password=${password}`;
  }

  /**
   * Validiert die Xtream Zugangsdaten
   */
  async validateLogin(): Promise<XtreamUserInfo> {
    const res = await fetch(`${this.base}&action=get_series`);
    const data = await res.json();

    if (!data.user_info) {
      throw new Error(data.message || 'Ungültige Xtream Zugangsdaten');
    }

    return data.user_info;
  }

  /**
   * Live TV Kategorien abrufen
   */
  async getLiveCategories(): Promise<XtreamCategory[]> {
    const res = await fetch(`${this.base}&action=get_live_categories`);
    return res.json();
  }

  /**
   * Live Streams abrufen (optional nach Kategorie gefiltert)
   */
  async getLiveStreams(categoryId?: string): Promise<XtreamStream[]> {
    let url = `${this.base}&action=get_live_streams`;
    if (categoryId) {
      url += `&category_id=${categoryId}`;
    }
    const res = await fetch(url);
    return res.json();
  }

  /**
   * VOD Kategorien abrufen
   */
  async getVodCategories(): Promise<XtreamCategory[]> {
    const res = await fetch(`${this.base}&action=get_vod_categories`);
    return res.json();
  }

  /**
   * VOD Streams abrufen (optional nach Kategorie gefiltert)
   */
  async getVodStreams(categoryId?: string): Promise<XtreamStream[]> {
    let url = `${this.base}&action=get_vod_streams`;
    if (categoryId) {
      url += `&category_id=${categoryId}`;
    }
    const res = await fetch(url);
    return res.json();
  }

  /**
   * Serien Kategorien abrufen
   */
  async getSeriesCategories(): Promise<XtreamCategory[]> {
    const res = await fetch(`${this.base}&action=get_series_categories`);
    return res.json();
  }

  /**
   * Alle Serien abrufen (optional nach Kategorie gefiltert)
   */
  async getAllSeries(categoryId?: string): Promise<XtreamSeries[]> {
    let url = `${this.base}&action=get_series`;
    if (categoryId) {
      url += `&category_id=${categoryId}`;
    }
    const res = await fetch(url);
    return res.json();
  }

  /**
   * Episoden einer spezifischen Serie abrufen
   */
  async getSeriesInfo(seriesId: number): Promise<any> {
    const res = await fetch(`${this.base}&action=get_series_info&series_id=${seriesId}`);
    return res.json();
  }

  /**
   * Stream URL generieren (für zukünftige Verwendung)
   */
  getStreamUrl(streamId: number, extension: string = 'm3u8'): string {
    const cleanDns = this.dns.replace(/\/$/, '');
    return `${cleanDns}/${streamId}.${extension}`;
  }
}

/**
 * Hilfsfunktion zum Erstellen einer XtreamAPI-Instanz
 */
export function createXtreamAPI(dns: string, username: string, password: string): XtreamAPI {
  return new XtreamAPI(dns, username, password);
}
