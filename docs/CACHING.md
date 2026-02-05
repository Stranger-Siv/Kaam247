# In-memory caching (TTL)

Lightweight in-memory cache for read-heavy endpoints to reduce MongoDB reads and protect Atlas Flex ops/sec. No Redis or external cache.

## Cache utility

- **Location:** `server/utils/cache.js`
- **Storage:** `Map` with per-key TTL (`expiresAt`).
- **Cleanup:** Interval every 60s removes expired entries; if size exceeds `CACHE_MAX_KEYS` (default 500), oldest-by-expiry keys are evicted.
- **Wrapper:** `withCache(keyFn, ttlMs, handler)` — caches the JSON response; on hit, responds from cache and logs `[cache hit] <key>` (skipped when `NODE_ENV=test`).

## Cached endpoints and TTLs

| Endpoint | Cache key | TTL |
|----------|-----------|-----|
| `GET /api/categories` | `categories` | 5 min |
| `GET /api/platform-config` | `platform-config` | 5 min |
| `GET /api/stats` (public) | `stats` | 90 sec |
| `GET /api/admin/settings` | `admin:settings` | 60 sec |
| `GET /api/admin/stats` | `admin:stats` | 60 sec |
| `GET /api/admin/dashboard` | `admin:dashboard` | 60 sec |
| `GET /api/admin/dashboard/charts?period=` | `admin:dashboard:charts:<period>` | 60 sec |
| `GET /api/admin/pilot-dashboard?week=` | `admin:pilot-dashboard:<week>` | 60 sec |
| `GET /api/admin/analytics` | `admin:analytics` | 60 sec |

Query params that affect the response are included in the key so cache keys are deterministic.

## Invalidation

- **Categories:** when admin updates config key `taskCategories` (PUT /api/admin/settings).
- **Platform config:** when admin updates config key `platformCommissionPercent`.
- **Admin settings:** on any PUT /api/admin/settings.
- **Public stats:** when task status or counts change (create, accept, start, complete, cancel, bulk cancel).
- **Admin dashboards (stats, dashboard, charts, pilot-dashboard, analytics):** on task state change (create, accept, start, complete, cancel, bulk cancel, admin cancel/unassign/hide) or user state change (block, unblock, ban).
- **Pilot dashboard only:** when pilot start date is set (PUT /api/admin/pilot-dashboard/start-date).

Cached requests do not hit MongoDB; repeat calls within TTL are served from memory and log `[cache hit] <key>`.

## Confirmation

Run the server and call a cached endpoint twice within the TTL window. The second request should return the same body and the server log should show `[cache hit] <key>`.

## Env

- `CACHE_MAX_KEYS` (optional): max number of keys; default 500.
