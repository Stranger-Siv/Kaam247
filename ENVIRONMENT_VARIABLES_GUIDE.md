# Complete Environment Variables Guide

This guide lists ALL environment variables you need for Kaam247, including Firebase authentication.

---

## 📁 Backend Environment Variables (`server/.env`)

### 1. Server Configuration

```env
# Server Port (default: 3001)
PORT=3001

# MongoDB Connection String
MONGO_URI=mongodb://localhost:27017/kaam247
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/kaam247

# JWT Secret Key (use a strong random string in production)
JWT_SECRET=your-secret-key-change-this-in-production
```

**Where to get:**
- `PORT`: Choose any port (default: 3001)
- `MONGO_URI`: Your MongoDB connection string
- `JWT_SECRET`: Generate a random string (e.g., use `openssl rand -base64 32`)

---

### 2. Firebase Admin SDK (for Phone OTP & Google OAuth)

```env
# Firebase Project ID
FIREBASE_PROJECT_ID=kaam247-abc123

# Firebase Private Key (MUST be in quotes and include \n)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# Firebase Client Email
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-abc12@kaam247-abc123.iam.gserviceaccount.com
```

**Where to get:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Gear icon** → **Project settings**
4. Go to **Service accounts** tab
5. Click **Generate new private key**
6. Download the JSON file
7. Open the JSON file and extract:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (copy ENTIRE key including BEGIN/END)
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

**Important:** 
- `FIREBASE_PRIVATE_KEY` must be in quotes `"..."` 
- Keep the `\n` characters in the private key
- The key should look like: `"-----BEGIN PRIVATE KEY-----\n...very long string...\n-----END PRIVATE KEY-----\n"`

---

## 📁 Frontend Environment Variables (`client/.env.local`)

### Firebase Client Configuration

```env
# Firebase API Key
VITE_FIREBASE_API_KEY=AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz

# Firebase Auth Domain
VITE_FIREBASE_AUTH_DOMAIN=kaam247-abc123.firebaseapp.com

# Firebase Project ID
VITE_FIREBASE_PROJECT_ID=kaam247-abc123

# Firebase Storage Bucket
VITE_FIREBASE_STORAGE_BUCKET=kaam247-abc123.appspot.com

# Firebase Messaging Sender ID
VITE_FIREBASE_MESSAGING_SENDER_ID=987654321

# Firebase App ID
VITE_FIREBASE_APP_ID=1:987654321:web:xyz789abc
```

**Where to get:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Gear icon** → **Project settings**
4. Scroll down to **Your apps** section
5. Click **Web icon** (`</>`) to add a web app
6. Register your app (nickname: "Kaam247 Web")
7. Copy the `firebaseConfig` values:
   - `apiKey` → `VITE_FIREBASE_API_KEY`
   - `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `VITE_FIREBASE_PROJECT_ID`
   - `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `VITE_FIREBASE_APP_ID`

---

## 📝 Complete Example Files

### `server/.env` (Complete Example)

```env
# Server Configuration
PORT=3001
MONGO_URI=mongodb://localhost:27017/kaam247
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345

# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=kaam247-abc123
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-abc12@kaam247-abc123.iam.gserviceaccount.com
```

### `client/.env.local` (Complete Example)

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz
VITE_FIREBASE_AUTH_DOMAIN=kaam247-abc123.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=kaam247-abc123
VITE_FIREBASE_STORAGE_BUCKET=kaam247-abc123.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=987654321
VITE_FIREBASE_APP_ID=1:987654321:web:xyz789abc
```

---

## 🔍 Quick Reference: Where to Find Each Value

| Variable | Location | How to Get |
|----------|----------|------------|
| **Backend** |
| `PORT` | Your choice | Any port number (default: 3001) |
| `MONGO_URI` | MongoDB | Your MongoDB connection string |
| `JWT_SECRET` | Generate | Random string (use `openssl rand -base64 32`) |
| `FIREBASE_PROJECT_ID` | Firebase Console | Project Settings → Service Accounts → JSON file → `project_id` |
| `FIREBASE_PRIVATE_KEY` | Firebase Console | Project Settings → Service Accounts → JSON file → `private_key` |
| `FIREBASE_CLIENT_EMAIL` | Firebase Console | Project Settings → Service Accounts → JSON file → `client_email` |
| **Frontend** |
| `VITE_FIREBASE_API_KEY` | Firebase Console | Project Settings → Your apps → Web app → `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Console | Project Settings → Your apps → Web app → `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Console | Project Settings → Your apps → Web app → `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Console | Project Settings → Your apps → Web app → `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console | Project Settings → Your apps → Web app → `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | Firebase Console | Project Settings → Your apps → Web app → `appId` |

---

## 📍 Step-by-Step: Where to Fill Each Variable

### Step 1: Backend (`server/.env`)

1. **Navigate to:** `server/` folder
2. **Create or edit:** `.env` file
3. **Add all variables** from the backend section above
4. **Save the file**

**File location:** `/Users/siv/Kaam247/server/.env`

### Step 2: Frontend (`client/.env.local`)

1. **Navigate to:** `client/` folder
2. **Create:** `.env.local` file (if doesn't exist)
3. **Add all variables** from the frontend section above
4. **Save the file**

**File location:** `/Users/siv/Kaam247/client/.env.local`

---

## ✅ Verification Checklist

After setting up, verify:

- [ ] `server/.env` exists and has all 6 variables
- [ ] `client/.env.local` exists and has all 6 variables
- [ ] `FIREBASE_PRIVATE_KEY` is in quotes
- [ ] `FIREBASE_PRIVATE_KEY` includes `\n` characters
- [ ] All Firebase values match between backend and frontend (same project)
- [ ] Backend server restarted after adding variables
- [ ] Frontend dev server restarted after adding variables

---

## 🚨 Common Mistakes to Avoid

1. ❌ **Missing quotes around FIREBASE_PRIVATE_KEY**
   - ✅ Correct: `FIREBASE_PRIVATE_KEY="-----BEGIN..."`
   - ❌ Wrong: `FIREBASE_PRIVATE_KEY=-----BEGIN...`

2. ❌ **Removing \n from private key**
   - ✅ Keep: `\n` characters
   - ❌ Don't remove them

3. ❌ **Wrong file location**
   - ✅ Frontend: `client/.env.local`
   - ❌ Not: `client/src/.env.local` or `client/.env`

4. ❌ **Mismatched project IDs**
   - ✅ Backend and frontend should use same `FIREBASE_PROJECT_ID`
   - ❌ Don't mix different Firebase projects

5. ❌ **Not restarting servers**
   - ✅ Restart after adding env variables
   - ❌ Old values are cached

---

## 🔐 Security Reminders

1. **Never commit** `.env` or `.env.local` files to Git
2. **Never share** your Firebase private key publicly
3. **Use strong** JWT_SECRET in production
4. **Keep** service account JSON file secure
5. **Rotate** keys if compromised

---

## 🎯 Quick Setup Commands

### Generate JWT Secret (Terminal)
```bash
openssl rand -base64 32
```

### Check if files exist
```bash
# Backend
ls -la server/.env

# Frontend
ls -la client/.env.local
```

### View variables (without exposing secrets)
```bash
# Backend
cat server/.env | grep -v "PRIVATE_KEY"

# Frontend
cat client/.env.local
```

---

## 📚 Additional Resources

- Firebase Console: https://console.firebase.google.com/
- MongoDB Atlas: https://www.mongodb.com/cloud/atlas
- Firebase Setup Guide: See `FIREBASE_SETUP_STEP_BY_STEP.md`

---

**That's all the environment variables you need! 🎉**
