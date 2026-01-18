# Fix: API Connection Error - api.kaam247.in not found

## Problem
The app is trying to connect to `https://api.kaam247.in` but this domain doesn't exist yet. You're seeing errors like:
- `WebSocket connection to 'wss://api.kaam247.in/socket.io/' failed`
- `GET https://api.kaam247.in/api/users/me/activity net::ERR_FAILED`

## Solution: Set Netlify Environment Variables

Until you set up `api.kaam247.in` DNS, use your Render backend URL:

### Step 1: Find Your Render Backend URL

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Find your backend service (the one running your Node.js server)
3. Copy the service URL (e.g., `https://kaam247-backend.onrender.com` or `https://kaam247.onrender.com`)

### Step 2: Set Environment Variables in Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Add or update these variables:

   **Variable 1:**
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://your-backend-name.onrender.com` (replace with your actual Render backend URL)
   - **Example**: `https://kaam247-backend.onrender.com`

   **Variable 2:**
   - **Key**: `VITE_SOCKET_URL`
   - **Value**: `https://your-backend-name.onrender.com` (same as above)
   - **Example**: `https://kaam247-backend.onrender.com`

### Step 3: Redeploy

1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. Wait for deployment to complete

### Step 4: Verify

1. Open your site (`https://kaam247.in`)
2. Open DevTools (F12) → Console tab
3. Check that API calls now go to your Render backend URL
4. No more `api.kaam247.in` errors

---

## Future: Set Up api.kaam247.in Subdomain

Once you're ready to use `api.kaam247.in`:

1. **Set up DNS**: Add a CNAME record for `api.kaam247.in` pointing to your Render backend
2. **Update Netlify**: Change environment variables to:
   - `VITE_API_BASE_URL` = `https://api.kaam247.in`
   - `VITE_SOCKET_URL` = `https://api.kaam247.in`
3. **Redeploy**: Trigger a new deployment

---

## Quick Checklist

- [ ] Found Render backend URL
- [ ] Set `VITE_API_BASE_URL` in Netlify
- [ ] Set `VITE_SOCKET_URL` in Netlify
- [ ] Redeployed site
- [ ] Verified no more connection errors

