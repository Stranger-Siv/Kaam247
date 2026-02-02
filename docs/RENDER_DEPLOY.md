# Render Deploy – Speed & Warnings

## Mongoose duplicate index warning (fixed)

You were seeing:

```
[MONGOOSE] Warning: Duplicate schema index on {"key":1} found.
```

**Cause:** In `server/models/Config.js`, the `key` field had `unique: true` (which creates an index) and there was also an explicit `configSchema.index({ key: 1 }, { unique: true })`, so the same index was defined twice.

**Fix:** The extra `configSchema.index({ key: 1 }, { unique: true })` was removed. `unique: true` on the field is enough. Redeploy and the warning should go away.

---

## Why deploys take 10+ minutes

Typical causes on Render:

### 1. Build phase (most common)

- **`npm install`** runs on every deploy. With a cold cache it can take 5–10+ minutes.
- **What to do:**
  - In Render dashboard: **Settings → Build & Deploy** → ensure **Dependency cache** is enabled (Render usually enables it for Node).
  - Use **Build Command**: `npm ci` (faster and reproducible; uses `package-lock.json`).
  - Avoid changing `package.json`/lockfile on every tiny commit so the cache can be reused.

### 2. Free tier cold start (first request after idle)

- Free web services **spin down** after ~15 minutes of no traffic.
- The **next request** triggers a cold start (container boot + `node index.js` + DB connect), which can take **1–3+ minutes** before the first response.
- That’s **request** latency, not deploy time. If you meant “first load is slow,” this is likely the reason.

**What to do:**

- Upgrade to a **paid** plan so the service stays always-on, or
- Use a **cron job** (e.g. Render cron or external like UptimeRobot) to hit your API every 10–14 minutes so it doesn’t spin down.

### 3. Heavy or native dependencies

- Large `node_modules` or native addons (e.g. some optional deps) can slow installs and builds.
- Your app uses `bcryptjs` (pure JS), which is fine. If you add native modules later, they’ll compile during build and can add time.

### 4. No custom build cache

- Render caches `node_modules` between builds when possible. If the build command clears the environment or you’re doing a full clean every time, cache won’t help.
- Keep **Build Command** simple, e.g. `npm ci` or leave default, and avoid scripts that delete the cache directory.

---

## Quick checklist

| Item | Action |
|------|--------|
| Duplicate index warning | Fixed in `server/models/Config.js` (remove extra `configSchema.index`). |
| Slow build | Use `npm ci`, enable dependency cache, avoid unnecessary cache clears. |
| Slow first request (free tier) | Expect 1–3 min cold start; use cron pings or upgrade to paid. |
| Start command | `node index.js` is fine; no change needed. |

If you share your exact Render **Build Command** and **Start Command**, we can tune them further (e.g. add a proper build step for the client if you deploy it from the same repo).
