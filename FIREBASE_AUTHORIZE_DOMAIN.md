# How to Authorize Your Domain in Firebase

This error means your domain `kaam247.in` is not authorized for OAuth operations (Google Sign-In, Phone OTP, etc.).

---

## 🔧 Fix: Add Domain to Authorized Domains

### Step 1: Go to Firebase Console
1. Open: https://console.firebase.google.com/
2. Select your project

### Step 2: Navigate to Authentication Settings
1. In the left sidebar, click **"Authentication"**
2. Click on the **"Settings"** tab (at the top)
3. Scroll down to find **"Authorized domains"** section

### Step 3: Add Your Domain
1. In the **"Authorized domains"** section, you'll see a list of domains
2. By default, you'll see:
   - `localhost` (for local development)
   - `your-project.firebaseapp.com`
   - `your-project.web.app`

3. Click **"Add domain"** button

4. Enter your domain:
   - **Domain:** `kaam247.in`
   - Click **"Add"**

5. If you also use `www.kaam247.in`, add that too:
   - Click **"Add domain"** again
   - Enter: `www.kaam247.in`
   - Click **"Add"**

### Step 4: Save
- The domain will be added automatically
- No need to click save - it's saved immediately

---

## 📝 Visual Guide

```
Firebase Console
  ↓
Authentication (Left Sidebar)
  ↓
Settings Tab (Top)
  ↓
Scroll to "Authorized domains"
  ↓
Click "Add domain"
  ↓
Enter: kaam247.in
  ↓
Click "Add"
  ↓
Done! ✅
```

---

## ✅ What Domains to Add

Add these domains if you use them:

1. **Production domain:**
   - `kaam247.in`
   - `www.kaam247.in` (if you use www)

2. **Already included (default):**
   - `localhost` (for local development)
   - `your-project.firebaseapp.com` (Firebase hosting)
   - `your-project.web.app` (Firebase hosting)

---

## 🔄 After Adding Domain

1. **Wait a few seconds** - Changes take effect immediately but may take 1-2 minutes to propagate
2. **Refresh your website** - Clear browser cache if needed
3. **Try Google Sign-In again** - It should work now

---

## 🧪 Test Locally

For local development, `localhost` is already authorized. But if you're testing on a different local domain:

1. Add your local domain (e.g., `127.0.0.1`, `localhost:5173`)
2. Or use `localhost` which is already authorized

---

## ⚠️ Important Notes

1. **HTTPS Required:**
   - Production domains must use HTTPS
   - Firebase won't work on HTTP in production

2. **Subdomains:**
   - If you use subdomains (e.g., `app.kaam247.in`), add each one separately

3. **Wildcards:**
   - Firebase doesn't support wildcards (e.g., `*.kaam247.in`)
   - Add each domain individually

---

## 🚨 Still Not Working?

If it still doesn't work after adding the domain:

1. **Wait 2-3 minutes** - Changes need time to propagate
2. **Clear browser cache** - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. **Check domain spelling** - Make sure it matches exactly (no typos)
4. **Check HTTPS** - Make sure your site uses HTTPS
5. **Check Firebase Console** - Verify domain appears in the list

---

## 📋 Quick Checklist

- [ ] Go to Firebase Console → Authentication → Settings
- [ ] Scroll to "Authorized domains"
- [ ] Click "Add domain"
- [ ] Enter `kaam247.in`
- [ ] Click "Add"
- [ ] Add `www.kaam247.in` if needed
- [ ] Wait 1-2 minutes
- [ ] Refresh your website
- [ ] Try Google Sign-In again

---

**That's it! Once you add the domain, Google Sign-In will work! 🎉**
