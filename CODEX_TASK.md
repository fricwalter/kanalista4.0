# Kanalista 4.0 — Codex Umbau-Task

Du arbeitest im Verzeichnis `D:\Projekte\Kanalista4.0\kanalista4.0`.
Das ist ein bestehendes Next.js 14 Projekt mit App Router, Tailwind CSS, Supabase und NextAuth.
Führe alle Phasen vollständig aus.

## ZIEL
Die Seite wird von einer login-basierten App zu einer **öffentlichen, loginfreien Kanal-Übersichtsseite** umgebaut.
- Kein Login mehr nötig
- Admin trägt Xtream-Credentials manuell in Supabase ein
- Seite zeigt öffentlich: Live-Kanäle, Filme, Serien (nur Metadaten, KEINE Stream-URLs)
- Daten werden 7 Tage gecacht (localStorage + Next.js ISR)

---

## PHASE 1 — DATEIEN LÖSCHEN

Lösche folgende Dateien und Ordner komplett:

```
app/api/auth/                          (ganzer Ordner)
app/api/users/                         (ganzer Ordner)
app/api/debug/                         (ganzer Ordner)
app/(protected)/                       (ganzer Ordner mit allen Unterordnern)
app/google-signin-button.tsx
app/providers.tsx
lib/auth.ts
```

Lösche aus package.json die Dependencies: `next-auth`, `@auth/core` (falls vorhanden).
Führe danach `npm install` aus.

---

## PHASE 2 — SUPABASE MIGRATIONEN

Erstelle die Datei `supabase/migrations/001_public_cache_schema.sql`:

```sql
-- Admin Config (NUR service_role, kein public access)
CREATE TABLE IF NOT EXISTS xtream_config (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label       text NOT NULL DEFAULT 'Hauptserver',
  server_url  text NOT NULL,
  username    text NOT NULL,
  password    text NOT NULL,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
ALTER TABLE xtream_config ENABLE ROW LEVEL SECURITY;
-- KEINE public policy — absichtlich kein anon Zugriff

-- Öffentlicher Channel Cache (ersetzt alte channel_cache)
DROP TABLE IF EXISTS channel_cache;
CREATE TABLE channel_cache (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id     uuid REFERENCES xtream_config(id),
  category      text NOT NULL CHECK (category IN ('live','vod','series')),
  data          jsonb NOT NULL,
  channel_count int,
  fetched_at    timestamptz DEFAULT now(),
  expires_at    timestamptz GENERATED ALWAYS AS (fetched_at + INTERVAL '7 days') STORED
);
ALTER TABLE channel_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read channel_cache" ON channel_cache FOR SELECT TO anon USING (true);

-- Öffentlicher Kategorien Cache
CREATE TABLE IF NOT EXISTS categories_cache (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id   uuid REFERENCES xtream_config(id),
  type        text NOT NULL CHECK (type IN ('live','vod','series')),
  categories  jsonb NOT NULL,
  fetched_at  timestamptz DEFAULT now(),
  expires_at  timestamptz GENERATED ALWAYS AS (fetched_at + INTERVAL '7 days') STORED
);
ALTER TABLE categories_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read categories_cache" ON categories_cache FOR SELECT TO anon USING (true);
```

---

## PHASE 3 — SUPABASE EDGE FUNCTION

Erstelle `supabase/functions/fetch-xtream-data/index.ts`:

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Felder die NIEMALS öffentlich gespeichert werden dürfen
const STRIP_LIVE = ["stream_id", "direct_source", "epg_channel_id", "custom_sid"];
const STRIP_VOD  = ["stream_id", "direct_source", "added", "custom_sid"];
const STRIP_SERIES = ["series_id", "direct_source", "youtube_trailer", "backdrop_path"];

function stripFields(arr: any[], fields: string[]): any[] {
  return arr.map(item => {
    const clean = { ...item };
    fields.forEach(f => delete clean[f]);
    return clean;
  });
}

Deno.serve(async (req) => {
  // Auth check
  const auth = req.headers.get("Authorization");
  if (auth !== `Bearer ${SERVICE_ROLE_KEY}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Aktive Config laden
  const { data: config, error: configError } = await supabase
    .from("xtream_config")
    .select("*")
    .eq("is_active", true)
    .limit(1)
    .single();

  if (configError || !config) {
    return new Response(JSON.stringify({ error: "Keine aktive Xtream Config gefunden" }), { status: 404 });
  }

  const { server_url, username, password, id: configId } = config;
  const base = `${server_url}/player_api.php?username=${username}&password=${password}`;

  const results: Record<string, any> = {};

  // Alle 6 Endpunkte abrufen
  const endpoints = [
    { action: "get_live_categories",  key: "live_categories" },
    { action: "get_live_streams",     key: "live_streams" },
    { action: "get_vod_categories",   key: "vod_categories" },
    { action: "get_vod_streams",      key: "vod_streams" },
    { action: "get_series_categories",key: "series_categories" },
    { action: "get_series",           key: "series" },
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(`${base}&action=${ep.action}`);
      results[ep.key] = await res.json();
    } catch (e) {
      results[ep.key] = [];
    }
  }

  // Sensible Felder entfernen
  const liveStreams  = stripFields(results.live_streams || [], STRIP_LIVE);
  const vodStreams   = stripFields(results.vod_streams || [], STRIP_VOD);
  const seriesData  = stripFields(results.series || [], STRIP_SERIES);

  // In channel_cache speichern (upsert nach category)
  const cacheEntries = [
    { config_id: configId, category: "live",   data: liveStreams,  channel_count: liveStreams.length },
    { config_id: configId, category: "vod",    data: vodStreams,   channel_count: vodStreams.length },
    { config_id: configId, category: "series", data: seriesData,  channel_count: seriesData.length },
  ];

  for (const entry of cacheEntries) {
    await supabase.from("channel_cache")
      .delete().eq("config_id", configId).eq("category", entry.category);
    await supabase.from("channel_cache").insert(entry);
  }

  // Kategorien speichern
  const catEntries = [
    { config_id: configId, type: "live",   categories: results.live_categories || [] },
    { config_id: configId, type: "vod",    categories: results.vod_categories || [] },
    { config_id: configId, type: "series", categories: results.series_categories || [] },
  ];

  for (const entry of catEntries) {
    await supabase.from("categories_cache")
      .delete().eq("config_id", configId).eq("type", entry.type);
    await supabase.from("categories_cache").insert(entry);
  }

  return new Response(JSON.stringify({
    success: true,
    counts: { live: liveStreams.length, vod: vodStreams.length, series: seriesData.length }
  }), { headers: { "Content-Type": "application/json" } });
});
```

---

## PHASE 4 — lib/ ANPASSEN

### lib/cache.ts (NEU erstellen)
```typescript
const CACHE_VERSION = '2.0';
const TTL = 7 * 24 * 60 * 60 * 1000; // 7 Tage

export function getCached<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`kanalista_${key}`);
    if (!raw) return null;
    const { data, timestamp, version } = JSON.parse(raw);
    if (version !== CACHE_VERSION || Date.now() - timestamp > TTL) {
      localStorage.removeItem(`kanalista_${key}`);
      return null;
    }
    return data as T;
  } catch { return null; }
}

export function setCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`kanalista_${key}`, JSON.stringify({
      data, timestamp: Date.now(), version: CACHE_VERSION
    }));
  } catch { /* localStorage voll */ }
}

export function clearCache(): void {
  if (typeof window === 'undefined') return;
  ['live_channels','vod_channels','series','live_cats','vod_cats','series_cats']
    .forEach(k => localStorage.removeItem(`kanalista_${k}`));
}
```

### lib/supabase.ts — behalte die bestehende Datei, ändere nichts

### lib/xtream.ts — behalte die bestehende Datei (XtreamAPI Klasse wird von der Edge Function genutzt)

---

## PHASE 5 — APP LAYOUT & PAGES

### app/layout.tsx — ersetze komplett
Entferne `SessionProvider` / `Providers`. Einfaches Layout ohne Auth:
```typescript
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kanalista 4.0 — IPTV Kanalübersicht",
  description: "Alle verfügbaren Live-Kanäle, Filme und Serien im Überblick",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
```

### app/page.tsx — ersetze komplett
Öffentliche Startseite mit 3 Statistik-Karten (Live, Filme, Serien) + Navigation.
Daten kommen aus Supabase `channel_cache` (Server Component, ISR 7 Tage).
```typescript
export const revalidate = 604800;
```
Zeige: Anzahl Live-Kanäle, Anzahl Filme, Anzahl Serien. Links zu /live, /filme, /serien.

### app/live/page.tsx (NEU)
- Server Component mit `export const revalidate = 604800`
- Lädt Kategorien aus `categories_cache` (type = 'live')
- Lädt Kanäle aus `channel_cache` (category = 'live')
- Client-seitig: Kategorie-Filter, Suchfeld (über gecachte Daten via localStorage)
- Zeigt: Kanal-Logo (stream_icon), Kanal-Name, Kategorie-Badge

### app/filme/page.tsx (NEU)
- Gleiche Struktur wie /live aber category = 'vod'
- Zeigt: Poster (stream_icon/thumbnail), Titel, Genre falls vorhanden

### app/serien/page.tsx (NEU)
- Gleiche Struktur aber category = 'series'
- Zeigt: Cover, Name, Genre, Rating

### app/suche/page.tsx (NEU)
- Client Component
- Lädt alle 3 Kategorien aus localStorage (getCached)
- Falls nicht gecacht: fetch von Supabase
- Globale Suche über Name/Kategorie aller Inhalte
- Ergebnisse gruppiert nach Typ (Live / Film / Serie)

---

## PHASE 6 — API ROUTE FÜR CACHE REFRESH

### app/api/refresh-cache/route.ts (NEU)
```typescript
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const auth = req.headers.get("Authorization");
  if (auth !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Supabase Edge Function triggern
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/fetch-xtream-data`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
    }
  );

  const data = await res.json();
  return NextResponse.json(data);
}
```

---

## PHASE 7 — .env.example AKTUALISIEREN

Überschreibe `.env.example`:
```
# Supabase (öffentlich - safe für Frontend)
NEXT_PUBLIC_SUPABASE_URL=https://supa.exyuiptv.org
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Nur server-side / Edge Functions - NIEMALS im Frontend!
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Entferne aus `.env.example`: NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_URL

---

## WICHTIGE REGELN:
1. NIEMALS stream_id, direct_source oder echte Stream-URLs öffentlich zugänglich machen
2. NIEMALS server_url, username, password aus xtream_config im Frontend anzeigen
3. Kein Login, keine Auth, keine geschützten Routen
4. Bestehende Tailwind Glass-Morphism Styles aus globals.css beibehalten
5. TypeScript überall, keine any außer wo unvermeidbar
6. Alle Texte auf Deutsch
