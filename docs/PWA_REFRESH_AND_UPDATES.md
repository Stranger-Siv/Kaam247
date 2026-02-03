# How to refresh the PWA so updates show

The app is a Progressive Web App (PWA). The browser and service worker cache files, so after a new deploy you might still see the old version until you refresh properly.

## Easiest: use the in-app option

1. Open **Profile** → **Settings**.
2. Scroll to the bottom and tap **Refresh app to get latest version**.
3. The app will clear caches, update the service worker, and reload. You should then see the latest version.

---

## Manual: hard refresh (by device/browser)

### Android (Chrome / PWA installed)

1. Open the Kaam247 app (or the site in Chrome).
2. **Option A:** In Settings inside the app, use **Refresh app to get latest version** (see above).
3. **Option B:** Clear site data:
   - Chrome: open `chrome://settings/siteData`, search for your Kaam247 domain, tap it → **Clear data**.
   - Then close the app completely and open it again (or open the PWA from the home screen again).

### iPhone / iPad (Safari or “Add to Home Screen” PWA)

1. **Option A:** Use **Refresh app to get latest version** in Settings (if you’re opening the PWA in a browser that supports it).
2. **Option B:** Clear website data:
   - **Settings** → **Safari** → **Advanced** → **Website Data** → find your Kaam247 domain → **Remove**.
   - Or **Settings** → **Safari** → **Clear History and Website Data** (this clears all sites).
3. Close the PWA (swipe it away) and open it again from the home screen.

### Desktop (Chrome / Edge)

1. **Hard reload:** `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac). This bypasses cache for the current page.
2. If that’s not enough: open DevTools (F12) → **Application** (Chrome) or **Storage** (Edge) → **Storage** → **Clear site data**, then reload the page.

---

## For developers

- After deploying, the new service worker will be picked up when the user next loads the app (or when they use **Refresh app to get latest version**).
- The build uses `skipWaiting` and `clientsClaim`, so when a new service worker is installed it can take over; a full page reload then serves the new assets.
- To test a deploy: use the in-app refresh, or clear site data / hard refresh as above.
