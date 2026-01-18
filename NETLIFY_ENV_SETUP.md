# 🔧 Fix: ERR_NAME_NOT_RESOLVED - Set Netlify Environment Variables

## ⚠️ Current Error
```
POST https://api.kaam247.in/api/auth/login net::ERR_NAME_NOT_RESOLVED
```

**Why?** The domain `api.kaam247.in` doesn't exist yet. You need to set Netlify environment variables to use your Render backend.

---

## ✅ Quick Fix (5 minutes)

### Step 1: Find Your Render Backend URL

1. Go to **[Render Dashboard](https://dashboard.render.com)**
2. Click on your **backend service** (the one running Node.js/Express)
3. Look at the top of the page - you'll see a URL like:
   - `https://kaam247-backend.onrender.com` OR
   - `https://kaam247.onrender.com` OR
   - `https://your-service-name.onrender.com`
4. **Copy this URL** - you'll need it in the next step

### Step 2: Set Environment Variables in Netlify

1. Go to **[Netlify Dashboard](https://app.netlify.com)**
2. Click on your site (the one deployed at `kaam247.in`)
3. Click **Site settings** (left sidebar)
4. Click **Environment variables** (under Build & deploy)
5. Click **Add a variable** button

**Add Variable 1:**
- **Key**: `VITE_API_BASE_URL`
- **Value**: Paste your Render backend URL (from Step 1)
- Click **Save**

**Add Variable 2:**
- Click **Add a variable** again
- **Key**: `VITE_SOCKET_URL`
- **Value**: Same Render backend URL (same as above)
- Click **Save**

**Example:**
```
VITE_API_BASE_URL = https://kaam247-backend.onrender.com
VITE_SOCKET_URL = https://kaam247-backend.onrender.com
```

### Step 3: Redeploy Your Site

**Important:** Environment variables only take effect after redeployment!

1. Still in Netlify Dashboard
2. Click **Deploys** tab (top menu)
3. Click **Trigger deploy** dropdown
4. Click **Deploy site**
5. Wait 2-3 minutes for deployment to complete

### Step 4: Test

1. Open your site: `https://kaam247.in`
2. Open DevTools (F12) → **Console** tab
3. Try to login
4. Check the console - you should see:
   ```
   🌐 API Configuration:
     API_BASE_URL: https://your-backend.onrender.com
     SOCKET_URL: https://your-backend.onrender.com
   ```
5. No more `ERR_NAME_NOT_RESOLVED` errors! ✅

---

## 📸 Visual Guide

### Netlify Environment Variables Location:
```
Netlify Dashboard
  → Your Site
    → Site settings (left sidebar)
      → Environment variables (under "Build & deploy")
        → Add a variable
```

### What to Enter:
```
┌─────────────────────────┬─────────────────────────────────────┐
│ Key                     │ Value                                │
├─────────────────────────┼─────────────────────────────────────┤
│ VITE_API_BASE_URL       │ https://kaam247-backend.onrender.com │
│ VITE_SOCKET_URL         │ https://kaam247-backend.onrender.com │
└─────────────────────────┴─────────────────────────────────────┘
```

---

## 🔍 How to Verify It's Working

After redeploying, check the browser console:

**✅ Good (Environment variables set):**
```
🌐 API Configuration:
  API_BASE_URL: https://kaam247-backend.onrender.com
  SOCKET_URL: https://kaam247-backend.onrender.com
  VITE_API_BASE_URL: https://kaam247-backend.onrender.com
  VITE_SOCKET_URL: https://kaam247-backend.onrender.com
```

**❌ Bad (Environment variables NOT set):**
```
🌐 API Configuration:
  API_BASE_URL: https://api.kaam247.in
  SOCKET_URL: https://api.kaam247.in
  VITE_API_BASE_URL: NOT SET
  VITE_SOCKET_URL: NOT SET
⚠️ WARNING: Using default api.kaam247.in but domain may not be set up yet!
```

---

## 🚨 Common Mistakes

❌ **Wrong:** Setting variables but not redeploying
- Environment variables only work after redeployment!

❌ **Wrong:** Using HTTP instead of HTTPS
- Must use `https://` not `http://`

❌ **Wrong:** Using frontend URL instead of backend URL
- Don't use `https://kaam247.in` (that's your frontend)
- Use `https://your-backend.onrender.com` (your backend)

❌ **Wrong:** Typos in variable names
- Must be exactly: `VITE_API_BASE_URL` and `VITE_SOCKET_URL`
- Case-sensitive!

---

## 📋 Checklist

- [ ] Found Render backend URL
- [ ] Added `VITE_API_BASE_URL` in Netlify
- [ ] Added `VITE_SOCKET_URL` in Netlify
- [ ] Both use HTTPS (not HTTP)
- [ ] Both point to Render backend (not frontend)
- [ ] Redeployed site
- [ ] Checked console - shows Render backend URL
- [ ] Tested login - no errors

---

## 🎯 After DNS is Set Up

Once you configure `api.kaam247.in` DNS to point to your backend:

1. Update Netlify environment variables:
   - `VITE_API_BASE_URL` = `https://api.kaam247.in`
   - `VITE_SOCKET_URL` = `https://api.kaam247.in`
2. Redeploy
3. Done! ✅

---

**Need Help?** Check `FIX_API_CONNECTION.md` for more details.

