# How Notifications "Over Other Apps" Work (PWA vs Delivery Apps)

## How delivery apps do it (Swiggy, Zomato, Uber, etc.)

1. **Push notifications (main way)**  
   They use **native push** (FCM on Android, APNs on iOS). When an order update or new offer arrives, the **OS** shows a notification:
   - **Android**: Banner at the top (heads-up) or in the notification shade.
   - **iOS**: Banner from the top or in Notification Center.

   The app does **not** draw a window over other apps. The **operating system** shows the notification over whatever is on screen. That’s why it works even when you’re in another app.

2. **Optional: overlay (Android only)**  
   Some Android delivery apps use **“Display over other apps”** (SYSTEM_ALERT_WINDOW) for things like a floating bubble or chat head. That needs a **native** app and special permission. PWAs **cannot** get this permission.

---

## Can we do the same in a PWA? **Yes – with Web Push**

PWAs **cannot** draw their own window over other apps. They **can** use **Web Push**, and then the **browser/OS** shows the notification over other apps, the same way as delivery apps.

### Flow

1. User grants **notification permission** in the PWA (e.g. Profile → Enable notifications).
2. The app gets an **FCM token** (or similar) and sends it to your backend.
3. When a **new task** is created (or any event you want to notify), the **backend** sends a push message via **Firebase Cloud Messaging (FCM)** to that token.
4. The **browser/OS** receives the push (even when the PWA is closed or in background) and **displays the notification** (banner / heads-up / notification shade).

So the “over other apps” effect is the **system notification**, not a custom overlay. That’s the same idea as delivery apps.

### What Kaam247 already has

- **Backend**: When a new task is broadcast to workers, the server calls `sendPushToUser(workerId, 'New task near you', title, { taskId, type: 'new_task' })`, which sends an FCM message to each worker’s saved token(s).
- **Service worker** (`firebase-messaging-sw.js`): When a push is received in background, it shows a system notification with `showNotification()`, with `requireInteraction: true` for new tasks and vibration.
- **High priority**: The server sets Web Push `Urgency: 'high'` (and optional Android/APNs priority) so the OS is more likely to show it as a heads-up/banner.

So when the user has **enabled notifications** in the app (and granted browser permission), new-task notifications **do** show over other apps via the OS notification, like delivery apps.

### What the user must do

1. Open the PWA (or site) and go to **Profile** (or your notifications settings).
2. Tap **“Enable notifications”** (or similar) and **allow** when the browser asks.
3. After that, when a new task arrives, they get a **system notification** (banner / heads-up) even if they’re in another app.

### Summary

| Capability                         | Native delivery app | PWA (Kaam247)      |
|------------------------------------|---------------------|--------------------|
| Push notification over other apps | ✅ (FCM/APNs)       | ✅ (Web Push / FCM) |
| Banner / heads-up when in another app | ✅               | ✅ (if user enabled) |
| Floating overlay / “over apps” window | ✅ (Android only, native) | ❌ (not possible in PWA) |

So: **yes, we can do “notifications over other apps” in the PWA** – by using Web Push and letting the OS show the notification, just like delivery apps. The only thing we **cannot** do in a PWA is a custom overlay window (bubble/chat head); that requires a native app.
