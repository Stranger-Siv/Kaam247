# Domain Setup Guide for Kaam247

This guide will help you configure your custom domain `kaam247.in` with Netlify.

## Prerequisites

- ✅ Domain purchased (`kaam247.in`)
- ✅ Netlify account with site deployed
- ✅ Backend deployed on Render (or your hosting provider)

## Step 1: Configure Domain in Netlify

### 1.1 Add Domain to Netlify Site

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site (`kaam247` or your site name)
3. Go to **Site settings** → **Domain management**
4. Click **Add custom domain**
5. Enter `kaam247.in`
6. Click **Verify**

### 1.2 Add WWW Subdomain (Optional but Recommended)

1. In **Domain management**, click **Add custom domain** again
2. Enter `www.kaam247.in`
3. Click **Verify**

### 1.3 Configure Domain Settings

1. In **Domain management**, click on `kaam247.in`
2. Enable **HTTPS** (should be automatic)
3. Set **Primary domain** to `kaam247.in` (or `www.kaam247.in` if you prefer)
4. Enable **Force HTTPS** (redirects HTTP to HTTPS)
5. If you added `www.kaam247.in`, configure redirect:
   - **Redirect `www.kaam247.in` to `kaam247.in`** OR
   - **Redirect `kaam247.in` to `www.kaam247.in`** (choose one as primary)

## Step 2: Configure DNS Records

Netlify will provide you with DNS records to add. You need to add these at your domain registrar (where you bought the domain).

### 2.1 Get DNS Records from Netlify

1. In **Domain management**, click on `kaam247.in`
2. You'll see DNS records like:
   ```
   Type: A
   Name: @
   Value: 75.2.60.5
   
   Type: CNAME
   Name: www
   Value: kaam247.netlify.app
   ```

### 2.2 Add DNS Records at Your Registrar

**Common Registrars:**

#### GoDaddy
1. Log in to GoDaddy
2. Go to **My Products** → **Domains** → `kaam247.in`
3. Click **DNS** or **Manage DNS**
4. Add the A record (Type: A, Name: @, Value: IP from Netlify)
5. Add the CNAME record (Type: CNAME, Name: www, Value: kaam247.netlify.app)

#### Namecheap
1. Log in to Namecheap
2. Go to **Domain List** → `kaam247.in` → **Manage**
3. Go to **Advanced DNS** tab
4. Add the A record and CNAME record from Netlify

#### Google Domains / Cloudflare
1. Log in to your registrar
2. Find DNS management section
3. Add the A and CNAME records from Netlify

### 2.3 DNS Propagation

- DNS changes can take **5 minutes to 48 hours** to propagate
- Usually takes **15-30 minutes** for most users
- Check propagation status: https://www.whatsmydns.net/#A/kaam247.in

## Step 3: Update Environment Variables

### 3.1 Update Netlify Environment Variables

Your environment variables should already be set, but verify:

1. Go to **Site settings** → **Environment variables**
2. Verify these are set:
   - `VITE_API_BASE_URL` = `https://api.kaam247.in` (your backend URL)
   - `VITE_SOCKET_URL` = `https://api.kaam247.in` (your backend URL)
   
   **Note:** If your backend is still on Render, you can keep using `https://kaam247.onrender.com` until you set up `api.kaam247.in` subdomain.

### 3.2 Redeploy After DNS Setup

After DNS propagates:
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. This ensures the site is built with the correct domain context

## Step 4: Verify Domain Setup

### 4.1 Check Domain Status

1. Visit `https://kaam247.in` (should load your site)
2. Visit `https://www.kaam247.in` (should redirect or load)
3. Check HTTPS certificate (should show valid SSL)

### 4.2 Test API Connection

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Try logging in
4. Check **Network** tab - API calls should go to your backend
5. Verify no CORS errors

### 4.3 Verify PWA Manifest

1. Open DevTools → **Application** → **Manifest**
2. Should show manifest detected
3. Check install prompt appears

## Step 5: Update Backend CORS (Already Done ✅)

The backend CORS has been updated to allow:
- `https://kaam247.in`
- `https://www.kaam247.in`
- `https://kaam247.netlify.app` (still works)

**Note:** After updating CORS, restart your Render backend service.

## Step 6: Optional - Update Documentation

Update any hardcoded references:
- README files
- Documentation
- Email templates (if any)
- Social media links

## Troubleshooting

### Domain Not Loading

1. **Check DNS propagation**: https://www.whatsmydns.net/#A/kaam247.in
2. **Verify DNS records** match Netlify exactly
3. **Wait 15-30 minutes** for propagation
4. **Clear browser cache** and try again

### SSL Certificate Issues

1. Netlify automatically provisions SSL certificates via Let's Encrypt
2. Wait 5-10 minutes after DNS propagation
3. Check **Domain management** → SSL certificate status
4. If issues persist, contact Netlify support

### CORS Errors

1. Verify backend CORS includes `https://kaam247.in`
2. Restart backend service (Render)
3. Check browser console for exact error
4. Verify `VITE_API_BASE_URL` is set correctly in Netlify

### Site Shows Netlify Default Page

1. Verify domain is added to correct Netlify site
2. Check **Domain management** → domain status
3. Ensure DNS records are correct
4. Redeploy site

## Quick Checklist

- [ ] Domain added to Netlify
- [ ] DNS records added at registrar
- [ ] DNS propagated (checked via whatsmydns.net)
- [ ] HTTPS certificate active
- [ ] Site loads at `https://kaam247.in`
- [ ] Environment variables verified
- [ ] Backend CORS updated (already done)
- [ ] Backend restarted (if needed)
- [ ] Site redeployed
- [ ] API calls working (no CORS errors)
- [ ] PWA manifest detected

## Support

- **Netlify Support**: https://www.netlify.com/support/
- **DNS Issues**: Check with your domain registrar
- **Backend Issues**: Check Render logs

---

**Last Updated**: After domain purchase setup
**Status**: ✅ Backend CORS updated, ready for DNS configuration

