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
-- KEINE public policy - absichtlich kein anon Zugriff

-- Oeffentlicher Channel Cache (ersetzt alte channel_cache)
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

-- Oeffentlicher Kategorien Cache
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
