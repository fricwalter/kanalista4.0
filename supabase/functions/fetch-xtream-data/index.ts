import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Felder die NIEMALS oeffentlich gespeichert werden duerfen
const STRIP_LIVE = ["stream_id", "direct_source", "epg_channel_id", "custom_sid"];
const STRIP_VOD = ["stream_id", "direct_source", "added", "custom_sid"];
const STRIP_SERIES = ["series_id", "direct_source", "youtube_trailer", "backdrop_path"];

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecordArray(value: unknown): JsonRecord[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord);
}

function stripFields(arr: JsonRecord[], fields: string[]): JsonRecord[] {
  return arr.map((item) => {
    const clean: JsonRecord = { ...item };
    fields.forEach((field) => {
      delete clean[field];
    });
    return clean;
  });
}

Deno.serve(async (req) => {
  const auth = req.headers.get("Authorization");
  if (auth !== `Bearer ${SERVICE_ROLE_KEY}`) {
    return new Response("Nicht autorisiert", { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: config, error: configError } = await supabase
    .from("xtream_config")
    .select("*")
    .eq("is_active", true)
    .limit(1)
    .single();

  if (configError || !config) {
    return new Response(JSON.stringify({ error: "Keine aktive Xtream Config gefunden" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { server_url, username, password, id: configId } = config;
  const base = `${server_url}/player_api.php?username=${username}&password=${password}`;

  const results: Record<string, unknown> = {};
  const endpoints = [
    { action: "get_live_categories", key: "live_categories" },
    { action: "get_live_streams", key: "live_streams" },
    { action: "get_vod_categories", key: "vod_categories" },
    { action: "get_vod_streams", key: "vod_streams" },
    { action: "get_series_categories", key: "series_categories" },
    { action: "get_series", key: "series" },
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(`${base}&action=${endpoint.action}`);
      results[endpoint.key] = await res.json();
    } catch {
      results[endpoint.key] = [];
    }
  }

  const liveStreams = stripFields(asRecordArray(results.live_streams), STRIP_LIVE);
  const vodStreams = stripFields(asRecordArray(results.vod_streams), STRIP_VOD);
  const seriesData = stripFields(asRecordArray(results.series), STRIP_SERIES);

  const cacheEntries = [
    { config_id: configId, category: "live", data: liveStreams, channel_count: liveStreams.length },
    { config_id: configId, category: "vod", data: vodStreams, channel_count: vodStreams.length },
    { config_id: configId, category: "series", data: seriesData, channel_count: seriesData.length },
  ] as const;

  for (const entry of cacheEntries) {
    await supabase
      .from("channel_cache")
      .delete()
      .eq("config_id", configId)
      .eq("category", entry.category);
    await supabase.from("channel_cache").insert(entry);
  }

  const catEntries = [
    { config_id: configId, type: "live", categories: asRecordArray(results.live_categories) },
    { config_id: configId, type: "vod", categories: asRecordArray(results.vod_categories) },
    { config_id: configId, type: "series", categories: asRecordArray(results.series_categories) },
  ] as const;

  for (const entry of catEntries) {
    await supabase.from("categories_cache").delete().eq("config_id", configId).eq("type", entry.type);
    await supabase.from("categories_cache").insert(entry);
  }

  return new Response(
    JSON.stringify({
      success: true,
      counts: {
        live: liveStreams.length,
        vod: vodStreams.length,
        series: seriesData.length,
      },
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
