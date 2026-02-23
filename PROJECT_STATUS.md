# Kanalista 4.0 - Projektstatus (Stand: 2026-02-23)

## 1. Aktueller Stand
- Git-Branch: `main`
- Letzter produktiver Fix-Commit: `094dd6f`
- Letzter Branding-Commit: `e0ce0c4`
- Arbeitsbaum: sauber, nur `upload/` ist unversioniert (bewusst als Ablageordner)

## 2. Was fertig ist
1. Admin-Modell umgesetzt
- Admin-E-Mail fest hinterlegt: `admirfric@gmail.com`
- Optional erweiterbar per `ADMIN_EMAILS` (CSV-Env)
- Login markiert Admin automatisch als `is_admin = true`

2. Rollen- und Zugriffskonzept umgesetzt
- Nur Admin darf Xtream-Zugangsdaten speichern/löschen.
- Nicht-Admins sehen keine Credential-Verwaltung.
- Nicht-Admins nutzen automatisch die vom Admin hinterlegten Credentials.
- Dashboard-Kategorien/Channels werden aus Admin-Credentials geladen.

3. Marketing-Consent umgesetzt
- Nicht-Admin-User sehen vor Dashboard ein Consent-Gate.
- Zustimmung wird in `users.marketing_opt_in` + `marketing_opt_in_at` gespeichert.

4. Auth-Stabilisierung umgesetzt
- Fix für `AccessDenied` bei Google-Login eingebaut.
- Sign-In ist schema-kompatibel mit Fallbacks für ältere DB-Struktur.
- Fehlende neue Spalten blockieren Login nicht mehr.

5. Branding umgesetzt
- Neues Logo eingebunden:
  - Landing: `app/page.tsx`
  - Protected Header: `app/(protected)/layout.tsx`
  - Datei: `public/logo.png`
- Website-Icon/Favicon eingebunden:
  - `app/icon.png`
  - `public/websiteicon.png`
  - `app/layout.tsx` (`metadata.icons`)

6. Build/Qualität
- Build läuft lokal erfolgreich: `npm run build`
- Änderungen sind auf GitHub `main` gepusht.

## 3. Wichtige Commits
1. `094dd6f` - Fix AccessDenied login by making auth DB writes backward compatible
2. `e0ce0c4` - Add provided logo and website icon across app
3. `5c32f44` - Enforce admin-only credential management and marketing consent gate
4. `582d09a` - Render sidebar categories and filter content by category
5. `39db392` - Handle Xtream upstream non-JSON errors and improve save error reporting

## 4. Relevante Dateien
- Rollen/Auth:
  - `lib/auth.ts`
  - `lib/resolve-auth-user.ts`
- Consent:
  - `app/(protected)/marketing-consent-gate.tsx`
  - `app/api/users/marketing-consent/route.ts`
  - `app/(protected)/layout.tsx`
- Admin-only Credentials:
  - `app/(protected)/credentials/layout.tsx`
  - `app/api/xtream/connect/route.ts`
  - `app/api/xtream/credentials/route.ts`
  - `app/api/xtream/categories/route.ts`
  - `app/api/xtream/channels/route.ts`
- DB/Migration:
  - `supabase/migrations/20260223000000_initial_schema.sql`
  - `supabase/migrations/20260223001000_add_admin_and_marketing_columns.sql`
- Branding:
  - `app/page.tsx`
  - `app/layout.tsx`
  - `app/(protected)/layout.tsx`
  - `app/icon.png`
  - `public/logo.png`
  - `public/websiteicon.png`

## 5. Offene/Pflegepunkte
1. Sicherstellen, dass in Supabase die neuen User-Spalten vorhanden sind:
- `is_admin`
- `marketing_opt_in`
- `marketing_opt_in_at`

2. Falls noch nicht ausgeführt, folgende SQL einmal in Supabase ausführen:
```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS marketing_opt_in_at TIMESTAMPTZ;

UPDATE users
SET is_admin = TRUE
WHERE lower(email) = 'admirfric@gmail.com';
```

3. Cloudflare Deployment prüfen:
- Der Push auf `main` triggert Auto-Deploy.
- Nach Deployment einen frischen Login (ggf. Cookies löschen) testen.
