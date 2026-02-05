# Rate limiting and abuse protection

In-memory sliding-window rate limiter to prevent request spikes from exhausting MongoDB Atlas Flex ops/sec. No Redis.

## Implementation

- **Location:** `server/utils/rateLimiter.js`
- **Algorithm:** Sliding window: per key we store request timestamps; only those within the last `windowMs` count. Old keys are removed by a periodic cleanup (every 2 min).
- **Key strategy:** Configurable per route:
  - **ip** – one limit per client IP (auth routes, geocode).
  - **user** – one limit per authenticated user (chat; requires `authenticate` before the limiter).
  - **userOrIp** – per user if authenticated, else per IP (task create/actions). Uses `optionalAuthenticate` so unauthenticated clients are limited by IP.
- **Response when limited:** HTTP 429 with `Retry-After` (seconds). Headers on every response: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` (Unix timestamp when the window resets).

## Route-to-limit mapping

| Route | Limit | Key |
|-------|--------|-----|
| POST /api/auth/login | 8/min | IP |
| POST /api/auth/register | 8/min | IP |
| POST /api/auth/google | 8/min | IP |
| POST /api/tasks | 15/min | user or IP |
| POST /api/tasks/:taskId/accept | 15/min | user or IP |
| POST /api/tasks/:taskId/start | 15/min | user or IP |
| POST /api/tasks/:taskId/mark-complete | 15/min | user or IP |
| POST /api/tasks/:taskId/confirm-complete | 15/min | user or IP |
| POST /api/tasks/:taskId/chat | 25/min | user |
| GET /api/geocode/reverse | 30/min | IP |

## Not rate-limited

- GET /health
- GET /api/categories, GET /api/platform-config (cached)
- GET /api/stats (cached)
- Admin and other read/list endpoints not listed above

## Configuration

Limits are set in the route files (authRoutes, taskRoutes, geocodeRoutes) via `createRateLimiter({ name, windowMs, max, keyBy })`. Adjust `max` or `windowMs` there if you need different limits.

## Confirmation

- **Abuse bursts blocked:** e.g. >8 POSTs to /api/auth/login from one IP within 1 minute returns 429 and `Retry-After`.
- **Normal usage:** Typical flows (e.g. 1–2 logins, a few task actions per minute) stay under the limits and are not affected.
