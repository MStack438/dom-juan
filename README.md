# DOM Juan — Quebec Real Estate Tracker

Personal real estate intelligence platform for tracking Quebec property listings.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL, Drizzle ORM
- **Scraper:** Playwright

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment**
   - Copy `.env.example` to `.env` (and `server/.env` if you run scripts from the server workspace)
   - Set `DATABASE_URL` to your PostgreSQL connection string. **Local development:** create a DB with `createdb domjuan`, then in both `.env` and `server/.env` use:
     ```env
     DATABASE_URL=postgresql://localhost:5432/domjuan
     ```
     (Use `postgresql://user:password@localhost:5432/domjuan` if your Postgres requires credentials.)
   - Set `APP_PASSWORD_HASH` (bcrypt hash of your app password):
     ```bash
     node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
     ```
   - Set `SESSION_SECRET` (e.g. a random 64-char string)

3. **Database**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Playwright (for scraper)**  
   Install Chromium so the scraper can run:
   ```bash
   npx playwright install chromium
   ```

5. **Run**
   ```bash
   npm run dev
   ```
   - App: http://localhost:5173
   - API: http://localhost:5000 (Vite proxies `/api` to the server)

**Local dev troubleshooting**

- The server **always loads `server/.env`** (not the repo root `.env`). Put `DATABASE_URL` and other vars in `server/.env` so the app and scripts (migrate, seed, scrape) use the same config.
- On startup you should see `[DB] Connected` in the server log. If you see `[DB] Connection failed: ...`, fix `DATABASE_URL` in `server/.env` (e.g. use `postgresql://localhost:5432/domjuan` for a local DB).
- If API calls return 500, check the server terminal for `[Server Error]` or `[Dashboard summary]` / `[Dashboard activity]` — the message shows the real error (e.g. connection refused, database missing).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start client + server in development |
| `npm run build` | Build server and client for production |
| `npm run start` | Start server (serve client in production) |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:seed` | Seed Quebec regions |
| `npm run db:studio` | Open Drizzle Studio (if configured) |
| `npm run typecheck` | Type-check server and client |
| `npm run scrape` | Run manual scrape from CLI (from server workspace) |

## Phase 5 Verification

- [x] Scraper runs on schedule (cron at SCRAPE_HOUR, America/Toronto; initialized in Phase 2)
- [x] Healthchecks.io receives pings (ping on success/fail when HEALTHCHECKS_PING_URL is set)
- [x] CSV export for tracking list: **Export CSV** on list detail → downloads `tracking-list-{name}.csv`
- [x] CSV export for listing history: **Export history CSV** on listing detail → downloads `snapshots-{mls}.csv`
- [x] Settings page shows scraper status and “Run scrape now” (Phase 3)

## Phase 4 Verification

- [x] Trend stats (avg DOM, avg price drop %) on tracking list detail
- [x] Listing filters: status (Active/Delisted/All), sort (DOM/Price/Date), order (Asc/Desc), price min/max
- [x] Can create tracking list via UI (New tracking list → form with CriteriaBuilder)
- [x] Can edit tracking list (Edit list → form with criteria pre-filled)
- [x] CriteriaBuilder: regions, price, beds/baths, property types, year built, lot/living area, must have / must not have

## Phase 3 Verification

- [x] Can navigate: Dashboard → Tracking list → Listing detail; Settings; back links
- [x] Dashboard shows QuickStats (active lists, active listings, last scrape)
- [x] Dashboard shows TrackingListCard grid and ActivityFeed
- [x] TrackingListDetail shows ListingTable with address, price, status, DOM, View link
- [x] ListingDetail shows price history chart (Recharts) and PropertyDetails
- [x] Settings shows scraper status and “Run scrape now” button

## Phase 2 Verification

- [x] Can trigger manual scrape via API (`POST /api/scraper/run` when authenticated)
- [x] Scraper creates run record and executes in background; errors logged in `scrape_run.errors`
- [ ] Scraper navigates Realtor.ca and data appears in DB (depends on Realtor.ca selectors; tune in Phase 2.5)
- [x] `GET /api/scraper/status` returns `running` and `lastRun`; `GET /api/scraper/runs` lists runs

## Phase 1 Verification

- [x] `npm run build` passes for both client and server
- [ ] Database tables created (`npm run db:migrate` with a running Postgres)
- [ ] Create/read tracking lists via API (after login)
- [ ] Login page works (set `APP_PASSWORD_HASH` and `SESSION_SECRET` in `.env`)
