-- ===========================================
-- IPTV Channel Browser v4.0 - Database Schema
-- Erstellt: 2026-02-23
-- ===========================================

-- Nutzer-Tabelle (wird von Google Auth befüllt)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  google_id TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  marketing_opt_in_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gespeicherte Xtream-Zugangsdaten pro User
CREATE TABLE IF NOT EXISTS xtream_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  dns TEXT NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kanal-Cache pro User
CREATE TABLE IF NOT EXISTS channel_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  credential_id UUID REFERENCES xtream_credentials(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('live', 'vod', 'series')),
  data JSONB NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(credential_id, type)
);

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================

-- RLS aktivieren
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE xtream_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_cache ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- RLS POLICIES
-- ===========================================

-- Users: jeder sieht nur seinen eigenen Datensatz
CREATE POLICY "Users can view own data" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Xtream Credentials: nur eigener User
CREATE POLICY "Users manage own credentials" ON xtream_credentials
  FOR ALL
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE google_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE google_id = auth.uid()));

-- Channel Cache: nur eigener User
CREATE POLICY "Users manage own cache" ON channel_cache
  FOR ALL
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE google_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE google_id = auth.uid()));

-- ===========================================
-- INDEXES
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_xtream_credentials_user_id ON xtream_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_channel_cache_user_id ON channel_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_channel_cache_credential_type ON channel_cache(credential_id, type);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ===========================================
-- FUNKTIONEN
-- ===========================================

-- Helper-Funktion um aktuellen User-ID zu bekommen
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
  SELECT id FROM users WHERE google_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;
