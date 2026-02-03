# Load Testing Kaam247 (Deployed)

How to check how much load the app can handle and how many concurrent users it supports.

---

## What “concurrent users” means here

| Part | What gets stressed | Typical bottleneck |
|------|-------------------|---------------------|
| **Frontend (Netlify)** | Static files (HTML, JS, CSS) | Netlify CDN handles high traffic; rarely the limit. |
| **Backend API (Render)** | HTTP requests to `https://kaam247.onrender.com` | **Main limit**: Render instance + MongoDB. |
| **WebSockets (Socket.IO)** | Real-time connections on same server | Same Node process as API; shares CPU/memory. |
| **MongoDB** | Queries from the API | Connection pool, query speed, Atlas free tier limits. |

So “how many concurrent users” is mostly: **how many concurrent API (and Socket) users can the backend + DB handle** before latency spikes or errors.

---

## Quick way: test the deployed API

### 1. Use a load-testing tool

**Option A: k6 (recommended, free)**

1. Install: https://k6.io/docs/get-started/installation/  
   - macOS: `brew install k6`
2. Run the included script (see below) against your **deployed** API base URL.

**Option B: Artillery (Node)**

```bash
npm install -g artillery
artillery quick --count 20 --num 50 https://kaam247.onrender.com/health
```

**Option C: Online (no install)**

- **Loader.io** (https://loader.io): Sign up, add your API URL (e.g. `https://kaam247.onrender.com`), then verify ownership: Loader.io gives you a token; the server serves it at `/loaderio-<token>.txt` (see `server/index.js` – Loader.io verification routes). Deploy the server, then in Loader.io click “Verify”. Set concurrent users and duration and run the test.
- **NBomber** (CLI) or **Apache JMeter** (GUI) if you prefer.

### 2. What to test

1. **Health only (no auth)**  
   - URL: `GET https://kaam247.onrender.com/health`  
   - Tells you: max throughput of the server before you add DB or auth.

2. **Realistic API (with auth)**  
   - Use a real JWT (from login) and hit endpoints like:  
     - `GET /api/users/me`  
     - `GET /api/tasks`  
   - Tells you: capacity under real usage (DB + auth + business logic).

3. **Ramp-up**  
   - Start at 5–10 concurrent users, then 20, 50, 100, etc., until latency or error rate gets bad.  
   - The number **before** that point is your practical “concurrent user” limit for that setup.

---

## k6 script (included)

Script: **`server/scripts/load-test.js`** (hits `/health` only; no auth).

From the repo root:

```bash
# Default: uses https://kaam247.onrender.com
k6 run server/scripts/load-test.js

# Custom API URL
k6 run -e BASE_URL=https://your-api.onrender.com server/scripts/load-test.js
```

Edit `server/scripts/load-test.js` to change:

- **`options.stages`**: e.g. `{ duration: '1m', target: 100 }` to test up to 100 concurrent users
- **`BASE_URL`** in script or via `-e BASE_URL=...`

You’ll see:

- **RPS** (requests per second)
- **Latency** (avg, p95, p99)
- **Error rate**
- **When** the server starts failing (timeouts, 5xx)

The “max concurrent users” you can handle is roughly: **number of VUs at the stage just before error rate or latency becomes unacceptable**.

---

## Deployed limits (what to expect)

### Render (backend)

- **Free tier**: Service spins down after ~15 min idle; first request after that is slow (“cold start”). One instance, shared CPU/RAM.
- **Paid tier**: Always on, more CPU/RAM, optional scaling.  
So “how many concurrent users” on **free** is low (often single-digit to low tens before slowdowns); on **paid** it’s higher and you discover it by running the load test.

### MongoDB (e.g. Atlas)

- **Free tier**: Limited connections (e.g. 500), storage, and read/write load.
- When you hit connection limit or IO, you’ll see errors or slow queries; that caps “concurrent users” from the DB side.

### Netlify (frontend)

- Static assets are CDN-backed; usually not the bottleneck. You don’t need to load-test the frontend for “concurrent users” unless you have server-side or edge logic.

---

## How to interpret results

| Metric | Good | Concerning |
|--------|------|------------|
| **Error rate** | 0% or near 0% | > 1% |
| **Avg latency** | Stable (e.g. &lt; 500 ms for API) | Climbing or &gt; 2–3 s |
| **p95 latency** | &lt; 1–2 s | &gt; 3–5 s |
| **RPS** | Stable as VUs increase | Drops or plateaus while VUs rise |

**“Max concurrent users”** in practice:

- Pick a target (e.g. “p95 &lt; 2 s and error rate &lt; 0.5%”).
- Increase load (VUs) until you break that target.
- The **previous** VU level is your approximate “concurrent users” the app can handle in that deployed state.

---

## One-line summary

- **Frontend:** Netlify CDN can handle a lot; not where you measure “concurrent users.”
- **Backend:** Use k6 (or another tool) on `https://kaam247.onrender.com` with the provided script; ramp up virtual users until latency or errors spike—that’s your limit for the **current** deployed state (Render + MongoDB).
- **Cold start:** On Render free tier, the first request after idle will be slow; include that in your “real-world” expectations unless you’re on a paid, always-on plan.
