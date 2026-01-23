# Google Authentication Testing Guide

## 🚀 Quick Start Testing

### Step 1: Start Backend Server

```bash
cd server
npm install  # If you haven't already
npm run dev  # Or npm start for production
```

**Expected Output:**
```
Server running at port 3001
Health check: http://localhost:3001/health
Socket.IO ready for connections
✅ Firebase initialized successfully
```

### Step 2: Run Backend Tests

In a new terminal:

```bash
cd server
node ../test-google-auth.js
```

**Expected Results:**
- ✅ Health Check - PASS
- ✅ CORS Configuration - PASS
- ✅ Cookie Parser Middleware - PASS
- ✅ Auth Middleware Cookie Support - PASS
- ✅ Google Verify Endpoint - PASS

### Step 3: Start Frontend

In a new terminal:

```bash
cd client
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Step 4: Test Google Sign-In Flow

1. **Open Browser:**
   - Go to: `http://localhost:5173/login`
   - Open DevTools (F12) → Console tab

2. **Check Firebase Initialization:**
   - Look for: `✅ Firebase initialized successfully`
   - Should see: `🔍 Firebase Auth Domain: kaam247-98b09.firebaseapp.com`

3. **Click "Continue with Google":**
   - Should redirect to Google sign-in page
   - Complete Google authentication
   - Should redirect back to `http://localhost:5173`

4. **Check Console Logs:**
   ```
   🔵 [AuthContext] loginWithGoogle called
   🔄 [AuthContext] Initiating signInWithRedirect...
   📋 [AuthContext] getRedirectResult returned: Result found
   ✅ [AuthContext] Backend verification successful
   ```

5. **Check Cookies:**
   - DevTools → Application → Cookies
   - Should see `token` cookie for `localhost:3001`
   - Cookie properties:
     - Name: `token`
     - Domain: `localhost`
     - HttpOnly: ✓
     - Secure: (only in production)
     - SameSite: `None` (or `Lax` in development)

6. **Check localStorage:**
   - DevTools → Application → Local Storage
   - Should have:
     - `kaam247_token`
     - `kaam247_user`

7. **Verify Navigation:**
   - Should redirect to `/dashboard` or `/admin`
   - User should be logged in

8. **Test Cookie Persistence:**
   - Refresh the page (F5)
   - User should remain logged in
   - Cookie should still be present

## 🧪 Manual Testing Checklist

### Backend Tests
- [ ] Server starts without errors
- [ ] Health check endpoint works: `GET /health`
- [ ] CORS allows frontend origin
- [ ] Cookie parser middleware is active
- [ ] Auth middleware reads cookies
- [ ] Google verify endpoint is accessible

### Frontend Tests
- [ ] Firebase initializes correctly
- [ ] Google sign-in button is visible
- [ ] Clicking button redirects to Google
- [ ] Google redirects back to app
- [ ] `getRedirectResult` catches redirect
- [ ] Backend verification succeeds
- [ ] Cookie is set correctly
- [ ] User is authenticated
- [ ] Navigation works (dashboard/admin)
- [ ] Cookie persists on refresh
- [ ] Logout clears cookie

### Production Tests (After Deployment)
- [ ] Domain is in Firebase Authorized Domains
- [ ] Environment variables are set correctly
- [ ] HTTPS is enabled (required for secure cookies)
- [ ] CORS allows production domain
- [ ] Cookie domain matches backend domain

## 🐛 Troubleshooting

### Issue: "Firebase not initialized"
**Solution:**
- Check `.env` file has all Firebase variables
- Verify `VITE_FIREBASE_API_KEY` is set
- Check browser console for specific error

### Issue: "No redirect result"
**Solution:**
- Verify domain is in Firebase Authorized Domains
- Check that redirect URL matches current origin
- Clear browser cache and try again

### Issue: "CORS error"
**Solution:**
- Verify backend CORS allows frontend origin
- Check that `credentials: true` is set in CORS
- Ensure `credentials: 'include'` in fetch calls

### Issue: "Cookie not set"
**Solution:**
- Check Network tab → Response Headers → `Set-Cookie`
- Verify cookie settings (httpOnly, secure, sameSite)
- In development, `secure: true` may cause issues (use `secure: false` for localhost)

### Issue: "401 Unauthorized"
**Solution:**
- Check Firebase Admin SDK is configured
- Verify `FIREBASE_PRIVATE_KEY` in backend `.env`
- Check backend logs for error details

## 📊 Test Results Template

```
Date: ___________
Tester: ___________

Backend Tests:
- Health Check: [ ] PASS [ ] FAIL
- CORS: [ ] PASS [ ] FAIL
- Cookie Parser: [ ] PASS [ ] FAIL
- Auth Middleware: [ ] PASS [ ] FAIL
- Google Verify: [ ] PASS [ ] FAIL

Frontend Tests:
- Firebase Init: [ ] PASS [ ] FAIL
- Google Redirect: [ ] PASS [ ] FAIL
- Cookie Set: [ ] PASS [ ] FAIL
- Authentication: [ ] PASS [ ] FAIL
- Persistence: [ ] PASS [ ] FAIL

Issues Found:
_______________________________________
_______________________________________
_______________________________________

Notes:
_______________________________________
_______________________________________
```

---

**Ready to test? Start with Step 1! 🚀**
