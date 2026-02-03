# SEO and Crawlers

## “Syntax not understood” on every line of index.html

If a tool (e.g. SEO checker, validator, or crawler) reports **“Syntax not understood”** for each line of your `index.html`, it usually means:

- The tool is **not** parsing the file as HTML. It may be in JavaScript, JSON, or another mode.
- Your **HTML is valid**. `index.html` is standard HTML5. Browsers and real crawlers understand it.

**What to do:**

1. If it’s a **validator**: Choose “HTML” (or “HTML5”) as the document type, then paste or upload the file. Do not use “JavaScript” or “CSS” mode.
2. If it’s an **SEO/crawler dashboard**: Make sure you’re submitting the **URL** of your live site (e.g. `https://kaam247.in`) so the crawler fetches the page as HTML over HTTP. Do not paste the raw HTML into a field that expects something else (e.g. sitemap XML or JSON).
3. If the tool only accepts a specific format (e.g. sitemap): Give it a sitemap URL (e.g. `https://yoursite.com/sitemap.xml`) if you have one, not the HTML of the app.

---

## “To appear in search results, crawlers need access to your app”

Crawlers need:

1. **HTTP 200** for your main URL (e.g. `https://kaam247.in`).
2. **No blocking** in `robots.txt` (or allow `/` and important paths).
3. **Same URL** for users and crawlers (no blanket redirect that only serves crawlers a different page).

**For a Vite/React SPA:**

- The server (e.g. Netlify) serves `index.html` for all routes (see `public/_redirects` or equivalent) so the app loads and crawlers get the HTML shell.
- The app has a descriptive **title** and **meta description** in `index.html` so crawlers (and social previews) see meaningful text even before JavaScript runs.
- If you need better SEO for deep links (e.g. `/tasks/123`), consider prerendering or SSR later; for the main landing page, the current setup is fine.

---

## “SEO not optimized”

We’ve improved the default SEO in `client/index.html`:

- **`<meta name="description">`** – Short summary for search snippets.
- **Open Graph tags** (`og:title`, `og:description`, `og:type`) – For social and messaging previews.

**Optional next steps:**

- Add **`og:image`** when you have a share image (e.g. 1200×630 PNG).
- Add a **sitemap** (e.g. `/sitemap.xml`) and submit it in Google Search Console.
- In **Google Search Console**, use “URL Inspection” and “Request indexing” for your main URL so crawlers are encouraged to visit.

---

## Summary

| Message | Meaning | Action |
|--------|--------|--------|
| Syntax not understood (every line) | Tool is parsing HTML as something else | Use HTML mode or submit live URL, not raw HTML |
| Crawlers need access | Tool wants to confirm the app is reachable | Ensure 200 OK, no blocking in robots.txt |
| SEO not optimized | Missing or weak meta/OG tags | Done in index.html; add og:image/sitemap if needed |
