# Google Authentication Fix Guide

## 🔍 Current Issues

1. **Error: `https://kaam247-98b09.firebaseapp.com/__/firebase/init.json`**
   - This is a **harmless error** - Firebase tries to auto-detect config from Firebase Hosting
   - Your app is hosted on `kaam247.in`, not Firebase Hosting, so this fails
   - **This error does NOT break authentication** - it's just a warning

2. **Cannot login via Google Auth**
   - This is the real issue that needs fixing

## ✅ Fix Steps

### Step 1: Verify Firebase Authorized Domains

**CRITICAL:** Your domain `kaam247.in` MUST be in Firebase's authorized domains list.

1. Go to: https://console.firebase.google.com/
2. Select your project: `kaam247-98b09`
3. Go to: **Authentication** → **Settings** tab
4. Scroll to: **"Authorized domains"** section
5. Check if `kaam247.in` is in the list
6. If NOT, click **"Add domain"** and add:
   - `kaam247.in`
   - `www.kaam247.in` (if you use www)

### Step 2: Verify Environment Variables

**In Production (Netlify/Vercel/etc.):**

Make sure these environment variables are set:

```bash
VITE_API_BASE_URL=https://api.kaam247.in
VITE_SOCKET_URL=https://api.kaam247.in
VITE_FIREBASE_API_KEY=AIzaSyAU579I7JLAWkFpTp4ShmvSuSaILfejqC4
VITE_FIREBASE_AUTH_DOMAIN=kaam247-98b09.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=kaam247-98b09
VITE_FIREBASE_STORAGE_BUCKET=kaam247-98b09.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=108028437426
VITE_FIREBASE_APP_ID=1:108028437426:web:a4e4bc89f1e08e164d3aab
```

**Important:** 
- `VITE_API_BASE_URL` should be `https://api.kaam247.in` (NOT localhost)
- `VITE_FIREBASE_AUTH_DOMAIN` should be `kaam247-98b09.firebaseapp.com` (this is correct)

### Step 3: Verify Backend CORS

Your backend at `https://api.kaam247.in` should allow:
- Origin: `https://kaam247.in`
- Credentials: `true`

This is already configured in `server/index.js`.

### Step 4: Test the Flow

1. **Clear browser cache** (Ctrl+Shift+R or Cmd+Shift+R)
2. Go to: `https://kaam247.in/login`
3. Click: **"Continue with Google"**
4. Complete Google sign-in
5. You should be redirected back to `https://kaam247.in`
6. Check browser console for logs

## 🐛 Debugging

### Check Browser Console

After clicking "Continue with Google", look for these logs:

```
✅ Firebase initialized successfully
🔍 Firebase Auth Domain: kaam247-98b09.firebaseapp.com
🔄 [AuthContext] Initiating signInWithRedirect...
```

After Google redirects back:

```
📋 [AuthContext] getRedirectResult returned: Result found
✅ [AuthContext] Backend verification successful
```

### Common Issues

1. **"No redirect result"**
   - Domain not authorized in Firebase
   - Check Step 1 above

2. **"CORS error"**
   - Backend CORS not configured
   - Check Step 3 above

3. **"401 Unauthorized"**
   - Cookie not being sent
   - Check that `credentials: 'include'` is in fetch calls
   - Check browser DevTools → Application → Cookies

4. **"Firebase not configured"**
   - Environment variables not set in production
   - Check Step 2 above

## 📝 Notes

- The `__/firebase/init.json` error is **harmless** and can be ignored
- Firebase will redirect back to your current origin (`kaam247.in`)
- Cookies are used for authentication persistence
- The token is also returned in the JSON response for backward compatibility

## ✅ Checklist

- [ ] `kaam247.in` is in Firebase Authorized Domains
- [ ] `www.kaam247.in` is in Firebase Authorized Domains (if used)
- [ ] `VITE_API_BASE_URL=https://api.kaam247.in` in production
- [ ] Backend CORS allows `https://kaam247.in`
- [ ] Cookies are being set (check DevTools)
- [ ] Tested Google sign-in flow

---

**After completing these steps, Google authentication should work! 🎉**
