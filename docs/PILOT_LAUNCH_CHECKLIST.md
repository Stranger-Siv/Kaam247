# Pilot Launch Checklist – Before Advertising

What to wrap up before you advertise Kaam247 for pilot testing.

---

## Must-have (do before ads)

### 1. Terms of Service & Privacy Policy
- **Status:** Register page links to `/terms` and `/privacy` but those routes may 404.
- **Do:** Add simple Terms and Privacy pages (or routes that render static content / PDF links), and link them from Register and Footer.
- **Pilot minimum:** At least one page each with “Terms of Service” and “Privacy Policy” (even short drafts). You can link to Google Docs/PDF initially if needed.

### 2. Support channel for pilots
- **Status:** You have in-app support (Settings → Account → support tickets).
- **Do:** Decide how pilots reach you: in-app ticket only, or also email/WhatsApp. Add that contact (e.g. “Pilot support: support@kaam247.in” or “Report issues in Settings → Account”) on a visible place (e.g. Footer, Settings, or a small “Pilot?” help link).

### 3. Pilot-friendly messaging
- **Do:** Add a short line that this is a **pilot** (e.g. on Home or after login): “We’re in pilot – your feedback helps us improve.” Optionally a “Report a bug” or “Give feedback” link that goes to your support/ticket flow.

### 4. App URL and install
- **Do:** Confirm production URL (e.g. **https://kaam247.in**) and that login/register work. In ads, send people to that URL. For mobile: “Add to Home Screen” (PWA) is enough; document it in `docs/MOBILE_APP_GUIDE.md` or a short “How to install” if you share that with pilots.

### 5. Backend and capacity
- **Do:** Backend and DB are deployed; load test suggested ~100 concurrent users is safe. No change needed before pilot unless you expect a big spike from the ad.

---

## Nice-to-have (recommended)

### 6. Known issues / “What to expect”
- **Do:** Keep a short list of known issues or limitations (e.g. “Cold start on free tier may delay first load,” “Feature X is coming soon”). Share in-app (e.g. Settings or a “Pilot info” modal) or in the ad copy so pilots know what to expect.

### 7. Basic monitoring
- **Do:** Glance at Render logs and MongoDB Atlas around launch. If you add uptime monitoring (e.g. UptimeRobot hitting `/health`) or error tracking later, that’s a plus.

### 8. Feedback loop
- **Do:** Decide how you’ll collect feedback (in-app tickets, one Google Form, WhatsApp group, etc.) and tell pilots in the ad or in-app.

---

## Advertising copy (short)

Use something like:

- **Headline:** “Kaam247 pilot – get local help or earn by doing tasks nearby.”
- **Body:** “We’re testing our hyperlocal task app in [your area]. Post a task or find work nearby. Pilot testers get early access; we’d love your feedback.”
- **CTA:** “Try it: https://kaam247.in” and “Add to Home Screen on mobile for app-like experience.”

---

## Quick checklist

| Item | Done |
|------|------|
| Terms of Service page/link (no 404) | ☐ |
| Privacy Policy page/link (no 404) | ☐ |
| Support channel clear (in-app + optional email) | ☐ |
| Pilot message on site (“We’re in pilot”) | ☐ |
| Production URL confirmed (e.g. kaam247.in) | ☐ |
| Known issues / expectations (optional) | ☐ |
| Ad copy + link ready | ☐ |

Once the top 4–5 are done, you’re in good shape to advertise for pilot testing.
