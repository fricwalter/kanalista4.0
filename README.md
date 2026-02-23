# Kanalista 4.0 - IPTV Channel Browser

Modern IPTV Channel Browser mit Next.js, Supabase und Google OAuth.

## Features

- **Google OAuth** - Sichere Anmeldung mit Google
- **Xtream Codes Support** - Live TV, VOD & Serien
- **Glass-Morphism UI** - Modernes, elegantes Design
- **Server-side Cache** - Supabase als Cache-Datenbank
- **Cloudflare Ready** - Deployment auf Cloudflare Pages

## Tech Stack

- Next.js 14+ (App Router)
- NextAuth.js v5 (Google OAuth)
- Supabase (PostgreSQL)
- Tailwind CSS + shadcn/ui
- TypeScript

## Quick Start

```bash
# Installation
npm install

# Environment setup
cp .env.example .env.local
# -> .env.local ausfüllen

# Development
npm run dev
```

## Deployment

### Cloudflare Pages

```bash
# Build
npm run cf:pages:build

# Deploy
npx wrangler pages deploy .cf-pages-webroot
```

## Lizenz

MIT
