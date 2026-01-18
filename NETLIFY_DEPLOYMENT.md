# Netlify Deployment Guide for Kaam247 Frontend

## Issue: CORS Error with Localhost

If you're seeing errors like:
```
Access to fetch at 'http://localhost:3001/api/auth/login' from origin 'https://kaam247.netlify.app' 
has been blocked by CORS policy: Permission was denied for this request to access the `unknown` address space.
```

This means your Netlify environment variables are not set correctly.

## Solution: Set Environment Variables in Netlify

### Step 1: Go to Netlify Dashboard

1. Log in to [Netlify](https://app.netlify.com)
2. Select your site (`kaam247`)
3. Go to **Site settings** → **Environment variables**

### Step 2: Add Required Environment Variables

Add these two environment variables:

#### 1. `VITE_API_BASE_URL`
- **Value**: `https://your-backend-name.onrender.com`
- **Example**: `https://kaam247-backend.onrender.com`
- **Important**: Replace `your-backend-name` with your actual Render backend service name
- **Must be HTTPS** (not HTTP)

#### 2. `VITE_SOCKET_URL`
- **Value**: `https://your-backend-name.onrender.com`
- **Example**: `https://kaam247-backend.onrender.com`
- **Same as API_BASE_URL** (your backend handles both API and Socket.IO)
- **Must be HTTPS** (not HTTP)

### Step 3: Redeploy

After adding environment variables:

1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. Or push a new commit to trigger automatic deployment

**Important**: Environment variables are only available at build time. You must redeploy after adding/changing them.

## How to Find Your Backend URL

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Find your backend service
3. Copy the service URL (should look like `https://something.onrender.com`)
4. Use that URL for both `VITE_API_BASE_URL` and `VITE_SOCKET_URL`

## Verification

After redeploying, check:

1. Open your Netlify site in browser
2. Open browser DevTools (F12)
3. Go to **Console** tab
4. Try to login
5. Check Network tab - requests should go to your Render backend URL, not localhost

## Common Mistakes

❌ **Wrong**: `VITE_API_BASE_URL=http://localhost:3001`
✅ **Correct**: `VITE_API_BASE_URL=https://kaam247-backend.onrender.com`

❌ **Wrong**: `VITE_API_BASE_URL=https://kaam247.onrender.com` (if that's your frontend)
✅ **Correct**: `VITE_API_BASE_URL=https://kaam247-backend.onrender.com` (your backend service)

❌ **Wrong**: Using HTTP instead of HTTPS
✅ **Correct**: Always use HTTPS for production

## Troubleshooting

### Still seeing localhost errors?

1. **Clear browser cache** - Old JavaScript might be cached
2. **Hard refresh** - Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. **Check build logs** - Make sure environment variables are visible in Netlify build logs
4. **Verify backend CORS** - Make sure your Render backend allows requests from `https://kaam247.netlify.app`

### Backend CORS Configuration

Your backend (`server/index.js`) should already be configured to allow Netlify. If not, make sure it includes:

```javascript
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true)
    if (origin.includes('kaam247.netlify.app') || origin.includes('localhost')) {
      return callback(null, true)
    }
    callback(null, true)
  },
  credentials: true
}
app.use(cors(corsOptions))
```

## Quick Checklist

- [ ] Backend deployed on Render and accessible
- [ ] Backend URL copied (e.g., `https://kaam247-backend.onrender.com`)
- [ ] `VITE_API_BASE_URL` set in Netlify environment variables
- [ ] `VITE_SOCKET_URL` set in Netlify environment variables
- [ ] Both variables use HTTPS (not HTTP)
- [ ] Site redeployed after setting variables
- [ ] Browser cache cleared
- [ ] Tested login/registration

---

**Last Updated**: Based on current codebase structure

