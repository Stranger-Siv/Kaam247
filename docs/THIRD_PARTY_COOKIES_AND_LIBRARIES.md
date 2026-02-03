# Third-Party Cookies and Detected Libraries

## Third-party cookies (e.g. “16 cookies found”)

The app uses services that set **third-party cookies** in the browser. This is expected and required for:

| Source | Purpose | Can you disable? |
|--------|---------|------------------|
| **Google (accounts.google.com, *.google.com)** | Google Sign-In (OAuth) | No – required for “Sign in with Google”. |
| **Firebase (googleapis.com, etc.)** | Push notifications (FCM), Firebase SDK | No – required for web push. |
| **Your API (e.g. Render)** | Backend API on a different domain | Yes – the client uses **Bearer token in `Authorization`** only; it does **not** rely on cookies for API auth. |

### What we did to limit cookies

- **API requests:** The client uses `credentials: 'omit'` for all requests to your backend. No cookies are sent or stored for the API domain, so the API does not add to the “third-party cookies” count from the app’s own backend.
- **Auth:** Token is stored in `localStorage` and sent in the `Authorization` header. No app-specific session cookies are used for your backend.

### If you need to reduce the count further

- You cannot remove Google/Firebase cookies without breaking Google Sign-In and push.
- To avoid cross-origin API cookies, keep the client on `credentials: 'omit'` and continue using only the Bearer token (current setup).

---

## “Detected JavaScript libraries”

Chrome DevTools (and similar tools) list libraries they detect on the page. For this app, that typically includes:

| Library | Use | Notes |
|---------|-----|--------|
| **React** | UI | Core framework. |
| **React Router** | Routing | Client-side routes. |
| **Google OAuth** (`@react-oauth/google`) | “Sign in with Google” | Required for Google login. |
| **Firebase** | Push notifications (FCM) | Required for web push. |
| **Socket.IO** | Real-time updates | Optional; app works without it. |
| **Leaflet / React-Leaflet** | Maps | Used for task location and maps. |
| **Recharts** | Charts | Used in admin/analytics. |

There is nothing to “fix” about detection itself. If a tool suggests updates or security issues, run:

```bash
cd client && npm audit
```

and address any reported vulnerabilities.

---

## Browser errors and Issues panel

- **Console errors:** Open DevTools → Console, reproduce the flow (e.g. login, post task), and fix the reported errors (e.g. missing keys, invalid props, failed fetches).
- **Issues panel:** DevTools → Issues lists cookie warnings, mixed content, deprecated APIs, etc. Many “third-party cookie” or “SameSite” messages come from Google/Firebase and are expected; you can’t remove them without dropping those features.

For app-specific issues (e.g. 401, CORS, missing env vars), fix the backend or client code as indicated by the error message.

### Quick checks

1. **Console:** DevTools → Console. Fix any red errors (e.g. missing `VITE_*` env, failed `fetch`, invalid props).
2. **Libraries:** Run `npm audit` in `client/` and `server/` and fix reported vulnerabilities.
3. **Cookies:** Google and Firebase cookies cannot be removed without disabling Sign-in with Google and push notifications. The app’s own API calls use Bearer token only and `credentials: 'omit'` to avoid adding API-domain cookies.
