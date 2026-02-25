# Codex Prompt für Kanalista 4.0 Setup

## Projektübersicht

Erstelle und deploye ein IPTV Channel Browser Projekt namens "Kanalista 4.0" mit folgenden Komponenten:

### Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Auth:** NextAuth.js v5 mit Google OAuth
- **Database:** Supabase (https://supa.exyuiptv.org)
- **Styling:** Tailwind CSS mit Glass-Morphism Theme
- **Deployment:** Cloudflare Pages

### Projektverzeichnis
Das Projekt befindet sich in: `D:\Projekte\Kanalista4.0\kanalista4.0\`

---

## Schritt-für-Schritt Anleitung

### 1. Supabase Schema anlegen

Gehe zu https://supa.exyuiptv.org/project/default → SQL Editor und führe folgendes SQL aus:

```sql
-- Nutzer-Tabelle
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  google_id TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Xtream Credentials
CREATE TABLE IF NOT EXISTS xtream_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  dns TEXT NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Channel Cache
CREATE TABLE IF NOT EXISTS channel_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  credential_id UUID REFERENCES xtream_credentials(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('live', 'vod', 'series')),
  data JSONB NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(credential_id, type)
);

-- RLS aktivieren
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE xtream_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own data" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users manage own credentials" ON xtream_credentials FOR ALL TO authenticated USING (user_id IN (SELECT id FROM users WHERE google_id = auth.uid()));
CREATE POLICY "Users manage own cache" ON channel_cache FOR ALL TO authenticated USING (user_id IN (SELECT id FROM users WHERE google_id = auth.uid()));
```

### 2. API Keys sammeln

**Supabase:**
- Gehe zu https://supa.exyuiptv.org/project/default → Settings → API
- Kopiere `Project URL` → `https://supa.exyuiptv.org`
- Kopiere `anon public` Key
- Kopiere `service_role` Key (nicht泄露 - nur server-side nutzen!)

**Google OAuth:**
- Gehe zu https://console.cloud.google.com/apis/credentials
- Erstelle OAuth 2.0 Client ID
- Authorized JavaScript origins: `http://localhost:3000`
- Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
- Kopiere Client ID und Client Secret

### 3. .env.local befüllen

Öffne `D:\Projekte\Kanalista4.0\kanalista4.0\.env.local` und trage alle Keys ein:

```env
NEXTAUTH_SECRET=<generiere mit: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=<dein-google-client-id>
GOOGLE_CLIENT_SECRET=<dein-google-client-secret>

NEXT_PUBLIC_SUPABASE_URL=https://supa.exyuiptv.org
NEXT_PUBLIC_SUPABASE_ANON_KEY=<dein-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<dein-service-role-key>
```

### 4. Dependencies installieren

```bash
cd D:\Projekte\Kanalista4.0\kanalista4.0
npm install
```

### 5. Development Server testen

```bash
npm run dev
```

Öffne http://localhost:3000

### 6. Git Repository erstellen & pushen

```bash
# GitHub CLI installieren (falls nicht vorhanden)
# Oder manuell auf GitHub ein Repository erstellen

cd D:\Projekte\Kanalista4.0\kanalista4.0
git add .
git commit -m "Initial commit: Kanalista 4.0"
git remote add origin https://github.com/fricwalter/kanalista4.0.git
git push -u origin main
```

### 7. Cloudflare Pages Deployment

1. Gehe zu https://dash.cloudflare.com → Pages
2. "Create project" → "Connect to Git"
3. Verbinde dein GitHub Repository
4. Build settings:
   - Build command: `npm run build`
   - Build output directory: `.next`
5. Environment variables in Cloudflare hinzufügen:
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL=https://kanalista4-0.pages.dev`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 8. Google OAuth Redirect URL updaten

Nach dem Deployment in Google Cloud Console:
- Authorized redirect URIs hinzufügen:
  `https://kanalista4-0.pages.dev/api/auth/callback/google`

---

## Wichtige Hinweise

1. **Sicherheit:** Xtream Credentials werden NIEMALS an den Browser gesendet - alle API-Calls laufen über Next.js Server-Side
2. **RLS:** Row Level Security ist aktiviert - jeder User sieht nur seine eigenen Daten
3. **Cache:** Kanäle werden in Supabase gecached für bessere Performance

---

## Projekt-Struktur (bereits vorhanden)

```
kanalista4.0/
├── app/
│   ├── api/auth/[...nextauth]/   # Google OAuth
│   ├── api/xtream/               # Xtream API Routes
│   ├── (protected)/              # Geschützte Seiten
│   ├── page.tsx                 # Landing Page
│   └── globals.css              # Glass-Morphism
├── lib/
│   ├── supabase.ts             # Supabase Client
│   ├── supabase-admin.ts       # Admin Client
│   ├── xtream.ts              # Xtream API Wrapper
│   └── auth.ts                 # NextAuth Config
├── supabase/migrations/         # SQL Schema
└── wrangler.toml               # Cloudflare Config
```

---

Viel Erfolg! 🚀
