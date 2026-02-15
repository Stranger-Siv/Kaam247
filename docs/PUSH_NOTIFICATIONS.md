# Push notifications & phone alerts

## Alert on phone while using Kaam247 on Chrome

Yes, this is supported. When someone is using Kaam247 on Chrome (website) and a new task appears, they can get an alert on their **phone** (ringing bell, vibration, lock-screen notification).

### How it works

1. **Enable notifications on the phone**  
   In the Kaam247 app (or PWA) on the phone: open **Profile** → **Notifications** → tap **Enable push notifications**. This registers the phone’s FCM token with the backend.

2. **Use the website on Chrome**  
   The worker browses Kaam247 on Chrome (desktop). They stay logged in as the same user.

3. **New task is posted**  
   When a new task is created (and the worker is within range), the server:
   - Sends a real-time update to the **browser** (Socket.IO) so the in-app “New tasks” panel can show.
   - Sends a **push notification** to **all registered devices** for that user (including the phone).

4. **Phone alerts**  
   The phone receives the FCM push and shows a system notification with:
   - Title: e.g. “New task near you”
   - Body: task title
   - Sound/vibration: according to the phone’s notification settings (and app/PWA settings).

So the worker can be on Chrome and still get a **ringing/buzzing** alert on their phone for every new task.

### Multi-device (phone + Chrome)

The backend stores **multiple FCM tokens** per user (up to 10). So the same user can:

- Enable push on **phone** → phone gets alerts.
- Enable push on **Chrome** (Profile → Enable push notifications) → Chrome gets browser notifications too.

When a new task is sent, **all** registered devices get the push. So:

- If they’re on Chrome, they can get both the in-app panel **and** a browser notification.
- Their phone will also get the push (ringing bell / vibration) at the same time.

### Requirements

- **Server**: Firebase Admin SDK configured (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` in `server/.env`).
- **Client**: VAPID key for Web Push in `client/.env` (`VITE_VAPID_KEY`), and Firebase config in `client/.env` (`VITE_FIREBASE_*`). The file `firebase-messaging-sw.js` is **generated at build** from `firebase-messaging-sw.template.js` using those env vars – do not commit a copy with real API keys.
- **User**: Enable push notifications at least on the **phone** (and optionally on Chrome) from Profile → Notifications.

### Security (Firebase API key)

- **Never commit** a Firebase API key or other secrets to the repo. The Firebase Cloud Messaging service worker is generated at build time from `client/firebase-messaging-sw.template.js` and `VITE_FIREBASE_*` env vars. The generated file `public/firebase-messaging-sw.js` is in `.gitignore`.
- If a key was ever exposed (e.g. in Git history): **regenerate it** in [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (Credentials → select the key → Regenerate key), then set the new value in your deployment env (e.g. Netlify, Vercel) and in local `client/.env`.
- In Google Cloud Console, add **API key restrictions** (e.g. restrict to your Firebase APIs and/or HTTP referrer to your domain) to limit abuse.

### Sound / “ringing bell”

- On **phone**: Sound and vibration are controlled by the device’s notification settings and the app/PWA’s notification channel. Users can set a custom “ringing bell” or default notification sound in system settings.
- On **Chrome (desktop)**: Browser notifications use the OS/browser notification sound; there is no separate “ring” setting in the app.
