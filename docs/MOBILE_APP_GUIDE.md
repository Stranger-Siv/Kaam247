# Kaam247 – Mobile App Guide (Information Only)

This doc answers: **Is it possible to make an app?** **What features can go in the app?** **How do I test everything locally?** Use it when you’re ready to implement; nothing here is implemented yet.

---

## 1. Is it possible? Yes

You already have a **PWA** (Progressive Web App): `manifest.json`, service worker, icons. So you have three realistic paths:

| Option | What it is | Pros | Cons |
|--------|------------|------|------|
| **PWA (current)** | Add to home screen, runs in browser | No app store, one codebase, works today | No store listing, some OS limits (notifications, background) |
| **Capacitor / TWA** | Wrap your existing React/Vite app in a native shell | Same codebase, publish to Play Store / App Store | Still “web in a shell”; some native APIs via plugins |
| **React Native (or Flutter)** | Separate native mobile app | Full native UX, best performance | New codebase, more work to build and maintain |

**Practical suggestion:**  
- **Short term:** Use the PWA + “Add to Home Screen” and test on real devices.  
- **When you want store presence:** Add **Capacitor** to the same React app, build iOS/Android, then test locally with emulators and devices.

---

## 2. Features you can have in the app

These map to what Kaam247 already has (or can have) and are testable locally.

### Core (already in the web app)

- **Auth:** Login, Register, Google OAuth, protected routes  
- **User modes:** Poster vs Worker, mode toggle  
- **Tasks (Worker):** Browse tasks, filters, swipe to accept/view, task detail, accept/cancel  
- **Tasks (Poster):** Post task, dashboard (my tasks), edit/cancel, increase budget, extend validity  
- **Chat:** Real-time task chat (Socket.IO)  
- **Profile & setup:** Profile, setup flow, availability toggle  
- **Earnings:** Worker earnings view  
- **Activity:** Activity/history  
- **Notifications:** Push (Firebase), in-app toasts, reminder toasts  
- **Maps / location:** Location picker (post task), task location map  
- **Theme:** Light / Dark / System  
- **Offline / PWA:** Service worker, cached shell; works offline for already-visited views  

### Mobile-specific (already or easy to add)

- **Pull-to-refresh:** Tasks list, Dashboard  
- **Swipe gestures:** Swipe on task cards (e.g. accept / view)  
- **Bottom nav:** Mobile-friendly navigation  
- **Responsive layout:** Works on small screens  
- **Touch targets:** Buttons/links sized for fingers  

### Optional (from roadmap / future)

- Rate limiting, validation, security headers (backend)  
- Filters & search on tasks (poster dashboard)  
- Recurring tasks, task analytics  
- Any new feature you add to the web app can be part of the “app” if you use PWA or Capacitor  

**Summary:** The same features you have (or plan) in the web app can be the “app” features; the only difference is how you ship them (PWA vs native wrapper vs full native).

---

## 3. How to test locally that features work

### 3.1 Run the app locally

```bash
# Terminal 1 – backend
cd server && npm install && npm run dev

# Terminal 2 – client
cd client && npm install && npm run dev
```

- Open **http://localhost:5173** (or the port Vite prints).  
- Use **Chrome DevTools → Device toolbar** (or similar) to simulate mobile viewport and touch.

### 3.2 Test on a real phone (same Wi‑Fi)

1. Find your machine’s LAN IP (e.g. `192.168.x.x`).  
2. In `client/vite.config.js`, ensure dev server allows host access (e.g. `host: true` or `host: '0.0.0.0'`).  
3. On the phone, open `http://<your-ip>:5173`.  
4. Test: login, switch mode, browse tasks, swipe, pull-to-refresh, chat, notifications (if allowed by browser), theme switch.

### 3.3 Test PWA “app” experience

1. Deploy or serve the **built** client (e.g. `npm run build` then `npm run preview`, or your staging URL).  
2. On the phone, open the site in **Chrome (Android)** or **Safari (iOS)**.  
3. Use “Add to Home Screen”.  
4. Open the icon and use the app like a native app (fullscreen, no browser UI).  
5. Verify: navigation, tasks, chat, theme, and any push notifications your setup supports in PWA.

### 3.4 If you add Capacitor later

- **Android:** Install Android Studio, open the Capacitor Android project, run on emulator or USB-connected device.  
- **iOS:** On a Mac, install Xcode, open the Capacitor iOS project, run on simulator or device.  
- Testing = run the same flows (auth, tasks, chat, notifications) in the Capacitor app on emulator/device.

### 3.5 Quick checklist (use when you implement)

- [ ] Login / Register / Google OAuth  
- [ ] Poster: post task, see dashboard, edit/cancel, increase budget  
- [ ] Worker: browse tasks, filters, swipe accept/view, task detail, accept/cancel  
- [ ] Chat: send/receive messages in real time  
- [ ] Notifications: permission, receive push (when backend/Firebase send)  
- [ ] Theme: Light / Dark / System  
- [ ] Pull-to-refresh on Tasks and Dashboard  
- [ ] Maps: post task location, view task location  
- [ ] Profile, availability, earnings, activity  
- [ ] PWA: add to home screen, open from icon, works offline for visited pages  

---

## 4. Next steps when you want to implement

1. **PWA only:** Harden offline behavior and test “Add to Home Screen” on iOS and Android.  
2. **App store:** Add Capacitor to `client`, configure `capacitor.config.ts`, add Android/iOS projects, then build and test locally (emulator + device) using the checklist above.  
3. **Full native:** Only if you need a separate codebase; then consider React Native (reuse JS/API knowledge) or Flutter.

If you share your chosen path (PWA-only vs Capacitor vs native), the next step can be a short “implementation” doc (e.g. exact Capacitor setup and first build/run commands) tailored to that choice.
