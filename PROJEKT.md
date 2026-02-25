# IPTV Channel Browser v4.0 - Kanalista 4.0

## 🚀 Quick Start

```bash
# 1. Projekt installieren
npm install

# 2. Umgebungsvariablen einrichten
cp .env.example .env.local
# -> .env.local ausfüllen (siehe unten)

# 3. Supabase Tabellen erstellen
npx supabase db push

# 4. Development Server starten
npm run dev
```

---

## 📋 Projektkonfiguration

### Supabase
- **URL:** https://supa.exyuiptv.org/project/default
- **Projektname:** kanalista4.0
- **Region:** ?

### Cloudflare
- **Deployment:** Cloudflare Pages
- **Projektname:** kanalista4.0

---

## 🏗️ Tech Stack

| Komponente | Technologie |
|------------|-------------|
| Framework | Next.js 14+ (App Router) |
| Auth | NextAuth.js v5 (Google OAuth) |
| Database | Supabase (PostgreSQL) |
| Styling | Tailwind CSS + shadcn/ui |
| API | Xtream Codes API |
| Deployment | Cloudflare Pages |

---

## 📁 Projektstruktur

```
kanalista4.0/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts   # Google OAuth
│   │   └── xtream/
│   │       ├── connect/route.ts          # Xtream Credentials speichern
│   │       ├── channels/route.ts         # Kanäle laden
│   │       └── credentials/route.ts       # Credentials verwalten
│   ├── (protected)/
│   │   ├── layout.tsx                    # Auth Guard
│   │   ├── dashboard/page.tsx            # Hauptseite
│   │   └── credentials/page.tsx         # Zugangsdaten
│   ├── page.tsx                          # Landing Page
│   ├── layout.tsx                        # Root Layout
│   └── globals.css                       # Glass-Morphism Theme
├── components/
│   ├── ChannelBrowser.tsx                # Tab-Switcher
│   ├── ChannelCard.tsx                   # Kanal-Karte
│   ├── CategorySidebar.tsx               # Kategorien-Filter
│   ├── SearchBar.tsx                     # Suche
│   ├── XtreamLoginForm.tsx               # Xtream Login
│   └── GoogleLoginButton.tsx             # Google Login
├── lib/
│   ├── supabase.ts                       # Supabase Client
│   ├── supabase-admin.ts                 # Admin Client (Service Role)
│   ├── xtream.ts                         # Xtream API Wrapper
│   └── auth.ts                           # NextAuth Config
├── types/
│   └── next-auth.d.ts                    # TypeScript Erweiterungen
├── supabase/
│   └── migrations/                        # Datenbank-Migrationen
├── public/
├── .env.example                          # Umgebungsvorlage
├── .env.local                            # Lokale Variablen (NICHT committen!)
├── supabase.toml                         # Supabase Config
├── wrangler.toml                         # Cloudflare Config
├── next.config.js                        # Next.js Config
├── tailwind.config.ts                    # Tailwind Config
├── tsconfig.json                         # TypeScript Config
└── package.json
```

---

## 🗄️ Supabase Schema

### Tabellen

```sql
-- Nutzer-Tabelle (wird von Google Auth befüllt)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  google_id TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Gespeicherte Xtream-Zugangsdaten pro User
CREATE TABLE xtream_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  dns TEXT NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Kanal-Cache pro User
CREATE TABLE channel_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  credential_id UUID REFERENCES xtream_credentials(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  data JSONB NOT NULL,
  cached_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(credential_id, type)
);
```

### RLS Policies

```sql
-- RLS aktivieren
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE xtream_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_cache ENABLE ROW LEVEL SECURITY;

-- Users: jeder sieht nur seinen eigenen Datensatz
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Xtream Credentials: nur eigener User
CREATE POLICY "Users manage own credentials" ON xtream_credentials
  FOR ALL USING (user_id = (SELECT id FROM users WHERE google_id = auth.uid()));

-- Channel Cache: nur eigener User
CREATE POLICY "Users manage own cache" ON channel_cache
  FOR ALL USING (user_id = (SELECT id FROM users WHERE google_id = auth.uid()));
```

---

## 🔐 Umgebungsvariablen

### .env.local (zum Kopieren)

```bash
# ===========================================
# NEXTAUTH AUTHENTICATION
# ===========================================
# Alternativen: AUTH_SECRET, NEXTAUTH_SECRET
NEXTAUTH_SECRET=HIER_EINEN_ZUFALLIGEN_STRING_EINFUEGEN
NEXTAUTH_URL=http://localhost:3000

# ===========================================
# GOOGLE OAUTH (Google Cloud Console)
# ===========================================
# Alternativen: AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# ===========================================
# SUPABASE
# ===========================================
NEXT_PUBLIC_SUPABASE_URL=https://supa.exyuiptv.org
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Generierung NEXTAUTH_SECRET

```bash
# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Oder mit OpenSSL
openssl rand -base64 32
```

---

## 🔧 Cloudflare Konfiguration

### wrangler.toml

```toml
name = "kanalista4-0"
compatibility_date = "2026-02-23"
compatibility_flags = ["nodejs_compat", "nodejs_compat_populate_process_env"]
pages_build_output_dir = ".cf-pages-webroot"

[vars]
NEXTAUTH_URL = "https://channel.exyuiptv.org"
NEXT_PUBLIC_SUPABASE_URL = "https://supa.exyuiptv.org"

# Google OAuth Credentials (direkt in wrangler.toml für zuverlässige Inject)
AUTH_GOOGLE_ID = "deine-client-id.apps.googleusercontent.com"
AUTH_SECRET = "dein-auth-secret"
```

### Cloudflare Pages Deploy

```bash
# Mit wrangler
npx wrangler pages deploy .next

# Oder mit GitHub Integration
# 1. GitHub Repo verbinden
# 2. Build Command: npm run build
# 3. Build Output: .next
```

---

## 🔧 Google OAuth Konfiguration (WICHTIG)

### Das Problem

Bei der ersten Einrichtung von Google OAuth kann der Fehler auftreten:
```
The OAuth client was not found.
Error 401: invalid_client
```

Dies liegt daran, dass die Google OAuth Credentials nicht korrekt an die Cloudflare Pages Anwendung übergeben werden.

### Die Lösung

Die Google OAuth Credentials werden **direkt in wrangler.toml** als `[vars]` definiert:

```toml
[vars]
NEXTAUTH_URL = "https://channel.exyuiptv.org"
NEXT_PUBLIC_SUPABASE_URL = "https://supa.exyuiptv.org"
AUTH_GOOGLE_ID = "deine-client-id.apps.googleusercontent.com"
AUTH_SECRET = "dein-generierter-secret"
```

### Alternative: Cloudflare Pages Secrets

Man kann die Credentials auch als Secrets in Cloudflare Pages setzen:

```bash
# AUTH_GOOGLE_ID setzen
npx wrangler pages secret put AUTH_GOOGLE_ID --project kanalista4-0-git

# AUTH_GOOGLE_SECRET setzen
npx wrangler pages secret put AUTH_GOOGLE_SECRET --project kanalista4-0-git

# AUTH_SECRET setzen
npx wrangler pages secret put AUTH_SECRET --project kanalista4-0-git
```

**WICHTIG:** Nach dem Ändern von Secrets muss ein **neues Deployment** getriggert werden (z.B. durch einen leeren Git Commit).

### Google Cloud Console Setup

1. **OAuth Client erstellen:**
   - https://console.cloud.google.com/apis/credentials
   - "OAuth 2.0 Client IDs" -> "Client erstellen"

2. **Authorized Redirect URIs:**
   - `https://channel.exyuiptv.org/api/auth/callback/google`
   - `https://kanalista4-0-git.pages.dev/api/auth/callback/google`

3. **OAuth Consent Screen:**
   - App veröffentlichen ODER
   - Test-User hinzufügen (admirfric@gmail.com)

### Credentials generieren

```bash
# AUTH_SECRET generieren (32 Bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📦 Installation & Setup

### Schritt 1: Projekt erstellen

```bash
# Next.js Projekt
npx create-next-app@latest kanalista4.0 --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm

cd kanalista4.0
```

### Schritt 2: Dependencies installieren

```bash
# Core Dependencies
npm install next-auth@beta @supabase/supabase-js

# shadcn/ui initialisieren
npx shadcn@latest init -d

# Benötigte Components
npx shadcn@latest add button card input dialog tabs sheet dropdown-menu
```

### Schritt 3: Supabase CLI

```bash
# Supabase CLI installieren (falls nicht vorhanden)
npm install -g supabase

# Supabase verknüpfen
supabase link --project-ref IHR_PROJECT_REF

# Migrationen ausführen
supabase db push
```

---

## 🎨 Glass-Morphism Theme

### globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
  }
}

@layer components {
  .glass-card {
    @apply bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl;
  }

  .glass-button {
    @apply bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 transition-all;
  }

  .glass-input {
    @apply bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-gray-400;
  }
}

body {
  @apply bg-black text-white;
  background: radial-gradient(ellipse at top, #1a1a2e 0%, #0f0f1a 100%);
  min-height: 100vh;
}
```

---

## 🔌 API Routes

### Xtream Connect (POST)

```typescript
// Speichert Xtream Credentials für den User
POST /api/xtream/connect
Body: { dns, username, password, label? }
Response: { success, credentialId }
```

### Channels (GET)

```typescript
// Lädt Kanäle mit Cache
GET /api/xtream/channels?type=live|vod|series&credentialId=UUID&refresh=true|false
Response: { data, fromCache, cachedAt }
```

### Credentials (GET/DELETE)

```typescript
// Alle Credentials des Users abrufen
GET /api/xtream/credentials
Response: [{ id, dns, label, created_at }]

// Credential löschen
DELETE /api/xtream/credentials?id=UUID
Response: { success }
```

---

## 🔒 Sicherheitsrichtlinien

1. **Xtream Credentials NIE im Browser** - Alle API-Calls über Server-Side
2. **RLS aktiviert** - Jeder User sieht nur seine eigenen Daten
3. **Service Role Key** nur Server-Side verwenden
4. **HTTPS erzwingen** für Session-Cookies
5. **Cache-Invalidierung** nur on-demand (manuellem Refresh)

---

## 📝 Changelog

### v4.0.0 (2026-02-23)
- Kompletter Neubau mit Next.js 14+
- NextAuth.js v5 mit Google OAuth
- Supabase als Datenbank + Cache
- Glass-Morphism UI Theme
- Cloudflare Pages Deployment
- Server-side Xtream API Calls

---

## 📞 Support

Bei Fragen oder Problemen:
- GitHub Issues
- Supabase Dashboard: https://supa.exyuiptv.org/project/default
