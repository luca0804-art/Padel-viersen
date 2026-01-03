# PadelMatch (Website/PWA Starter)

Das ist ein schlankes MVP als Website (Next.js) mit Supabase (Auth + DB).
Features:
- Login via Magic Link (Email)
- Profil (Name, Stadt, **Viersen-Default**, Elo-Startwert, **Suchradius + Standort (Lat/Lng)**)
- Match-Angebote erstellen (optional mit Standort)
- Match-Angebote ansehen + beitreten
- Match-Detailseite mit Teilnehmerliste
- Einfaches Ranking nach `profiles.rating_elo` (Filter default: Viersen)

## Viersen & Umgebung (Radius-Suche)
Wenn du im Profil deinen Standort speicherst (Lat/Lng oder Button **„Standort automatisch übernehmen“**),
kann die Matches-Seite per **Umkreis (km)** suchen. Das läuft über PostGIS + die RPC-Funktion
`nearby_match_offers` in `supabase/schema.sql`.

## 1) Supabase Projekt anlegen
1. Neues Projekt erstellen
2. In der SQL-Editor Ansicht das Script aus `supabase/schema.sql` ausführen
3. Authentication:
   - Email Auth aktivieren (Magic Link / OTP)
   - Unter **Authentication → URL Configuration** deine Dev-URL erlauben:
     - `http://localhost:3000`

## 2) Env Variablen setzen
Erstelle eine `.env.local` im Projektroot:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Beides findest du in Supabase: **Project Settings → API**

## 3) Starten
```
npm install
npm run dev
```

Dann: http://localhost:3000

## Viersen & Umgebung (Radius-Suche)
Wenn du im **Profil** deinen Standort setzt (oder „Standort automatisch übernehmen“ nutzt),
werden auf der Matches-Seite standardmäßig **Angebote im Umkreis** (Standard: 25 km) geladen.
Du kannst jederzeit auf „Nur Stadt“ umschalten.
Technik: PostGIS + RPC `nearby_match_offers`.

## Nächste sinnvolle Steps
- Chat pro Match (z.B. `match_messages` Tabelle)
- Ergebnis melden + bestätigen (2-phase confirm)
- Elo Update (Cloud Function / Edge Function)
- Kartenansicht (Leaflet/Mapbox) + Court-Liste (Community gepflegt)
- PWA Add-to-Home (Manifest + icons)
