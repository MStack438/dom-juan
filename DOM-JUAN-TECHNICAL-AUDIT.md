# DOM Juan — Technical Audit & Repair Strategy

**Date:** February 17, 2026
**Auditor:** Theo (Claude)
**Requested by:** Marie-Jo
**Scope:** Full codebase audit — municipality dropdown bug, deployment issues, Railway friction, architectural concerns

---

## Executive Summary

The municipality dropdown showing "No Municipalities Found" is caused by a **double API prefix bug** in `MunicipalitySelector.tsx` — the only file in the entire frontend that passes `/api/regions` to the API client instead of `/regions`. Since the API client already prepends `/api`, the actual HTTP request goes to `/api/api/regions?level=2`, which doesn't exist.

Beyond this primary bug, the audit found **5 additional issues** across deployment, migrations, session management, and the seed-on-deploy architecture. None are catastrophic individually, but together they create the "constant problems" pattern you've been experiencing.

Railway isn't fundamentally blocking you, but the current deployment architecture has several friction points that compound under Railway's constraints.

---

## Issue #1: Municipality Dropdown Bug (CRITICAL)

**Symptom:** "No Municipalities Found" when creating a new tracking list.

**Root Cause:** Double `/api` prefix in `MunicipalitySelector.tsx`.

**File:** `client/src/components/tracking-list/MunicipalitySelector.tsx`, lines 32 and 42

```typescript
// CURRENT (broken) — results in fetch to /api/api/regions?level=2
return api.get<Region[]>('/api/regions?level=2');
// ...
return api.get<Region[]>('/api/regions');
```

Every other file in the codebase uses the correct pattern:
```typescript
// hooks/useRegions.ts (correct)
api.get<Region[]>('/regions')
api.get<RegionTreeNode[]>('/regions/tree')

// hooks/useDashboard.ts (correct)
api.get<DashboardSummary>('/dashboard/summary')
```

**What happens in production:** The catch-all `app.get('*')` in `server/src/index.ts` serves `index.html` for unknown routes. So `/api/api/regions?level=2` returns HTML, `res.json()` fails silently (the `.catch(() => ({}))` in `handleResponse` swallows it), and the component receives an empty object. `Array.isArray(municipalitiesData)` returns `false`, so `municipalities` defaults to `[]`.

**Fix:**
```typescript
// Line 32: Change '/api/regions?level=2' to '/regions?level=2'
return api.get<Region[]>('/regions?level=2');

// Line 42: Change '/api/regions' to '/regions'
return api.get<Region[]>('/regions');
```

**Risk:** Zero. This is a straightforward path correction. No other files are affected.

**Better long-term fix:** The `MunicipalitySelector` should use the existing `useRegions` hook from `hooks/useRegions.ts` instead of inline `useQuery` calls. This prevents the pattern from recurring.

---

## Issue #2: Silent Error Swallowing in API Client (MEDIUM)

**File:** `client/src/lib/api.ts`, line 5

```typescript
const data = await res.json().catch(() => ({}));
```

When the server returns HTML (404 catch-all) or non-JSON, the error is caught and replaced with an empty object `{}`. The `!res.ok` check on line 6 would catch HTTP errors, but when the catch-all returns HTML with status 200, `res.ok` is `true` — so the empty object passes through as "success."

This is exactly why the municipality dropdown fails silently instead of showing an error.

**Fix:** Add response content-type validation:
```typescript
async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Expected JSON but got ${contentType} from ${res.url}`);
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as { error?: { message?: string } })?.error?.message ?? res.statusText);
  }
  return data as T;
}
```

**Risk:** Low. This makes errors visible instead of silent. May surface other latent issues — which is the point.

---

## Issue #3: Orphaned Migrations (MEDIUM)

**Files:**
- `server/migrations/add-centris-support.sql`
- `server/migrations/add-listing-date-fields.sql`

**Problem:** The migrate script (`scripts/migrate.ts`) only applies `0000_initial.sql`. The two additional migration files in `server/migrations/` (note: different directory than `src/db/migrations/`) are never automatically applied. The Drizzle schema (`schema/listing.ts`, `schema/tracking-list.ts`) defines columns (`source`, `centrisNumber`, `originalListDate`, `listedDaysWhenFound`) that may not exist in the database.

The Railway deploy command runs `npm run db:migrate`, which only checks for the `region` table and applies `0000_initial.sql` if missing. The Centris and date-fields migrations are never run.

**Impact:** If the Railway database was created fresh (or recreated), the `source` column on `tracking_list` and `listing` won't exist, and the `centrisNumber`, `originalListDate`, `listedDaysWhenFound` columns on `listing` won't exist. This would cause 500 errors on any operation touching those columns.

If the database was manually migrated (via `psql < migrations/add-centris-support.sql`), it works — but this is fragile and undocumented in the deploy pipeline.

**Fix:** Update `scripts/migrate.ts` to apply all migrations in order:
```typescript
const migrations = [
  '0000_initial.sql',
  '../../migrations/add-centris-support.sql',
  '../../migrations/add-listing-date-fields.sql',
];
```
Or consolidate everything into the initial migration if the database can be recreated.

**Risk:** Low if done incrementally. Use `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` patterns (which the migration files already use).

---

## Issue #4: Seed-on-Deploy Fragility (MEDIUM)

**File:** `railway.toml`, line 6

```toml
startCommand = "npm run db:migrate && (npm run db:seed-municipalities || echo 'Seed failed or already complete') && npm run start"
```

**Problems:**

1. **The seed script fetches from an external URL at deploy time.** `seed-municipalities.ts` calls `fetch('https://donneesouvertes.affmunqc.net/repertoire/MUN.csv')` — a Quebec government open data endpoint. If that endpoint is slow, down, or returns unexpected data during a Railway deploy, the seed fails. The `|| echo` fallback means the app starts without municipality data.

2. **Serial execution adds deploy time.** Migration + seed + startup all run sequentially. The seed script inserts ~1,100 municipalities one-by-one (no batch insert), which against a remote DB is slow.

3. **The seed runs on every deploy.** It's idempotent (checks for existing records), but it still fetches the CSV and processes all records every time, adding unnecessary latency to every deploy.

**Fix options:**

- **Option A (recommended):** Bundle the municipality data as a JSON file in the repo. Seed from local file instead of remote URL. This eliminates the external dependency and makes seeding instant.
- **Option B:** Move seeding to a separate one-time command. Only run `db:migrate && npm run start` on deploy. Seed manually or via the existing `/api/scraper/seed-municipalities` endpoint.
- **Option C:** Add a quick-check at the start of the seed script — if level-2 regions already exist, exit immediately without fetching the CSV.

**Risk:** Option A is safest. Option C is quickest to implement (partially exists in the API endpoint but not in the CLI script).

---

## Issue #5: In-Memory Sessions on Railway (LOW-MEDIUM)

**File:** `server/src/middleware/auth.middleware.ts`

Express sessions use the default `MemoryStore`. Railway containers restart on every deploy (and can restart on crashes or scaling). Every restart wipes all sessions, forcing re-login.

For a personal app this is annoying but not critical. However, combined with the restart-on-failure policy (`restartPolicyMaxRetries = 3`), a crash loop means repeated authentication loss.

**Fix:** Either accept the UX cost (it's a personal app), or switch to a persistent session store using the existing PostgreSQL database via `connect-pg-simple`.

**Risk:** Low. This is a UX improvement, not a functional bug.

---

## Issue #6: Vite Dev Proxy Port Mismatch (LOW)

**File:** `client/vite.config.ts`, line 17

```typescript
proxy: { '/api': { target: 'http://localhost:5100' } }
```

**File:** `server/src/index.ts`, line 29

```typescript
const PORT = parseInt(process.env.PORT || '5000', 10);
```

The Vite dev proxy points to port `5100`, but the server defaults to port `5000`. This means local development requires setting `PORT=5100` in `server/.env`, which isn't documented. If someone clones the repo and runs `npm run dev`, the API proxy silently fails and all API calls 404.

**Fix:** Either change the Vite proxy target to `5000`, or document the required `PORT=5100` in the README / `.env.example`.

**Risk:** Zero. Dev-only concern.

---

## Repair Priority & Execution Order

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| **P0** | #1 Double API prefix in MunicipalitySelector | 5 min | Fixes the dropdown immediately |
| **P1** | #2 Silent error swallowing in API client | 15 min | Makes future bugs visible |
| **P1** | #3 Orphaned migrations | 30 min | Prevents column-not-found errors on fresh deploy |
| **P2** | #4 Seed-on-deploy fragility | 1 hr | Eliminates external dependency, speeds deploys |
| **P3** | #5 In-memory sessions | 30 min | Prevents auth loss on restart |
| **P3** | #6 Dev proxy port mismatch | 5 min | Developer experience |

### Safe Execution Order

1. **Fix #1 first.** Two-line change, zero risk, immediate payoff.
2. **Fix #2 next.** This will surface any other latent issues before you fix them.
3. **Fix #3 before the next deploy.** Consolidate migration strategy.
4. **Fix #4 when convenient.** Bundle municipality data locally.
5. **Fix #5 and #6 as quality-of-life improvements.**

---

## Railway Assessment

Railway isn't the root cause of your problems — the bugs exist independent of hosting platform. However, Railway amplifies them:

- **Ephemeral containers** mean every deploy is a fresh start. If the seed fails silently, you get no municipalities until you notice and manually re-seed.
- **External network calls during deploy** (the QC government CSV fetch) add a failure mode that wouldn't exist with bundled data.
- **No persistent filesystem** means you can't cache the CSV between deploys.
- **MemoryStore sessions** reset on every deploy, which Railway does more aggressively than a traditional VPS.

For a personal app, Railway is fine once these issues are fixed. The alternative (a VPS with persistent state) trades one set of problems for another (manual ops, security patching, etc.).

---

## Validation Checklist

After implementing fixes, verify:

- [ ] `GET /api/regions?level=2` returns ~1,100 municipalities (not HTML, not empty)
- [ ] Municipality dropdown populates when creating a new tracking list
- [ ] Browser DevTools Network tab shows no `/api/api/` double-prefix requests
- [ ] `GET /api/debug/db-status` shows all three region levels with correct counts
- [ ] Non-JSON API responses (404s, catch-all HTML) throw visible errors in the console
- [ ] A fresh database + deploy correctly creates all tables including Centris columns
- [ ] The seed completes within the Railway deploy timeout (120s healthcheck)

---

*— Theo*
