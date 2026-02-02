# How to Register Web App in Firebase

This guide shows you exactly how to register a web app in Firebase to get your frontend credentials.

---

## 📱 Step-by-Step: Register Web App

### Step 1: You're in the Right Place
If Firebase is asking you to "Register an app", you're in the correct location:
- **Location:** Firebase Console → Project Settings → General tab → "Your apps" section

### Step 2: Click the Web Icon
1. In the **"Your apps"** section, you'll see several icons:
   - **iOS** (Apple icon)
   - **Android** (Android icon)
   - **Web** (`</>`) ← **Click this one!**
   - **Unity** (if available)
   - **Flutter** (if available)

2. Click the **Web icon** (`</>`) - it looks like HTML brackets `< >`

### Step 3: Register Your App
A popup/modal will appear with a form:

1. **App nickname:**
   - Enter: `Kaam247 Web` (or any name you prefer)
   - This is just a label for your reference

2. **Firebase Hosting:**
   - **DO NOT** check this box (unless you want Firebase Hosting)
   - Leave it unchecked for now

3. **Click "Register app"** button

### Step 4: Copy the Configuration
After clicking "Register app", you'll see a code block that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz",
  authDomain: "kaam247-abc123.firebaseapp.com",
  projectId: "kaam247-abc123",
  storageBucket: "kaam247-abc123.appspot.com",
  messagingSenderId: "987654321",
  appId: "1:987654321:web:xyz789abc"
};
```

**This is what you need!** Copy each value:

- `apiKey` → `VITE_FIREBASE_API_KEY`
- `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
- `projectId` → `VITE_FIREBASE_PROJECT_ID`
- `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET`
- `messagingSenderId` → `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `appId` → `VITE_FIREBASE_APP_ID`

### Step 5: Continue
1. After copying the values, click **"Continue to console"** button
2. You're done! The app is now registered

---

## 📝 What to Do with These Values

### Add to `client/.env.local`

Create or edit the file: `client/.env.local`

Add these lines (replace with YOUR values):

```env
VITE_FIREBASE_API_KEY=AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz
VITE_FIREBASE_AUTH_DOMAIN=kaam247-abc123.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=kaam247-abc123
VITE_FIREBASE_STORAGE_BUCKET=kaam247-abc123.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=987654321
VITE_FIREBASE_APP_ID=1:987654321:web:xyz789abc
```

**Important:** 
- Replace the example values with YOUR actual values from Firebase
- Don't include quotes around the values
- Don't include `const firebaseConfig = {` or `};` - just the values

---

## 🎯 Visual Guide

```
Firebase Console
  ↓
Project Settings (Gear icon ⚙️)
  ↓
General Tab
  ↓
Scroll to "Your apps" section
  ↓
Click Web Icon (</>)
  ↓
Register App Form:
  ┌─────────────────────────┐
  │ App nickname:           │
  │ [Kaam247 Web      ]     │
  │                         │
  │ ☐ Firebase Hosting     │ ← Don't check this
  │                         │
  │    [Register app]       │ ← Click this
  └─────────────────────────┘
  ↓
Copy firebaseConfig values
  ↓
Add to client/.env.local
```

---

## ✅ After Registration

Once you've registered the app:

1. ✅ The app will appear in "Your apps" section
2. ✅ You can always see the config again by clicking the Settings icon (⚙️) next to your app
3. ✅ You can register multiple web apps if needed (for different environments)

---

## 🔄 If You Already Registered

If you already registered a web app before:

1. In "Your apps" section, you'll see your app listed
2. Click the **Settings icon** (⚙️) next to your app name
3. Or click on the app name itself
4. You'll see the `firebaseConfig` code block again
5. Copy the values from there

---

## ❓ Common Questions

### Q: What if I don't see the Web icon?
**A:** Make sure you're in:
- Project Settings → General tab
- Scroll down to "Your apps" section
- The Web icon should be there

### Q: Can I register multiple web apps?
**A:** Yes! You can register multiple apps for different environments (dev, staging, production)

### Q: What if I close the popup before copying?
**A:** No problem! Click the Settings icon (⚙️) next to your app in "Your apps" section to see the config again

### Q: Do I need Firebase Hosting?
**A:** No, you don't need it for authentication. Leave it unchecked.

---

## 🎉 You're Done!

After registering and copying the values:
1. Add them to `client/.env.local`
2. Restart your frontend dev server
3. Firebase authentication will work!

---

**That's it! Just register the app and copy the config values! 🚀**
