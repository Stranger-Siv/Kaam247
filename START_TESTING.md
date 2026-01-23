# 🧪 Start Testing Google Authentication

## Quick Start

### Step 1: Start Backend Server

```bash
cd server
npm run dev
```

**Wait for:**
```
Server running at port 3001
✅ Firebase initialized successfully
```

### Step 2: Run Backend Tests (in a new terminal)

```bash
cd server
node test-auth-simple.js
```

**Expected Output:**
```
✅ PASS - Server is running
✅ PASS - CORS credentials enabled
✅ PASS - Cookie parser is working
✅ PASS - Endpoint is accessible
```

### Step 3: Start Frontend (in another terminal)

```bash
cd client
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

### Step 4: Test in Browser

1. **Open:** `http://localhost:5173/login`
2. **Open DevTools:** Press F12
3. **Go to Console tab**
4. **Click:** "Continue with Google"
5. **Complete Google sign-in**
6. **Check Console for:**
   ```
   ✅ Firebase initialized successfully
   🔄 [AuthContext] Initiating signInWithRedirect...
   📋 [AuthContext] getRedirectResult returned: Result found
   ✅ [AuthContext] Backend verification successful
   ```

7. **Check Cookies:**
   - DevTools → Application → Cookies → `http://localhost:5173`
   - Should see `token` cookie

8. **Check Navigation:**
   - Should redirect to `/dashboard` or `/admin`
   - User should be logged in

9. **Test Persistence:**
   - Refresh page (F5)
   - User should remain logged in

## ✅ Success Criteria

- [ ] Backend server starts without errors
- [ ] Backend tests pass
- [ ] Frontend starts without errors
- [ ] Firebase initializes correctly
- [ ] Google sign-in redirects work
- [ ] Cookie is set after authentication
- [ ] User is redirected to dashboard/admin
- [ ] Cookie persists on page refresh
- [ ] Logout clears cookie

## 🐛 If Tests Fail

### Backend won't start:
- Check `.env` file has all required variables
- Verify MongoDB connection
- Check Firebase Admin SDK configuration

### Frontend won't start:
- Check `client/.env` has Firebase variables
- Verify `VITE_FIREBASE_API_KEY` is set

### Google sign-in fails:
- Check browser console for errors
- Verify domain is in Firebase Authorized Domains
- Check CORS configuration

### Cookie not set:
- Check Network tab → Response Headers
- Verify `Set-Cookie` header is present
- In development, cookies work on `localhost`

---

**Ready? Start with Step 1! 🚀**
