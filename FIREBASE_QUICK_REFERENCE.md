# Firebase Setup - Quick Reference Card

Use this as a checklist while setting up Firebase.

---

## 📍 Where to Find Each Value

### Frontend Values (from Firebase Console > Project Settings > Your apps > Web app)

1. **VITE_FIREBASE_API_KEY**
   - Location: `firebaseConfig.apiKey`
   - Example: `AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz`

2. **VITE_FIREBASE_AUTH_DOMAIN**
   - Location: `firebaseConfig.authDomain`
   - Example: `kaam247-abc123.firebaseapp.com`

3. **VITE_FIREBASE_PROJECT_ID**
   - Location: `firebaseConfig.projectId`
   - Example: `kaam247-abc123`

4. **VITE_FIREBASE_STORAGE_BUCKET**
   - Location: `firebaseConfig.storageBucket`
   - Example: `kaam247-abc123.appspot.com`

5. **VITE_FIREBASE_MESSAGING_SENDER_ID**
   - Location: `firebaseConfig.messagingSenderId`
   - Example: `987654321`

6. **VITE_FIREBASE_APP_ID**
   - Location: `firebaseConfig.appId`
   - Example: `1:987654321:web:xyz789abc`

---

### Backend Values (from Service Account JSON file)

1. **FIREBASE_PROJECT_ID**
   - Location: JSON file → `project_id`
   - Example: `kaam247-abc123`

2. **FIREBASE_PRIVATE_KEY**
   - Location: JSON file → `private_key`
   - **IMPORTANT**: Copy the ENTIRE value including:
     - `-----BEGIN PRIVATE KEY-----`
     - All the characters in between
     - `-----END PRIVATE KEY-----`
     - Keep the `\n` characters!
   - Example: `"-----BEGIN PRIVATE KEY-----\nMIIE...very long...\n-----END PRIVATE KEY-----\n"`

3. **FIREBASE_CLIENT_EMAIL**
   - Location: JSON file → `client_email`
   - Example: `firebase-adminsdk-abc12@kaam247-abc123.iam.gserviceaccount.com`

---

## 📁 File Locations

### Backend Config
- File: `server/.env`
- Add these 3 variables:
  ```env
  FIREBASE_PROJECT_ID=...
  FIREBASE_PRIVATE_KEY="..."
  FIREBASE_CLIENT_EMAIL=...
  ```

### Frontend Config
- File: `client/.env.local` (create if doesn't exist)
- Add these 6 variables:
  ```env
  VITE_FIREBASE_API_KEY=...
  VITE_FIREBASE_AUTH_DOMAIN=...
  VITE_FIREBASE_PROJECT_ID=...
  VITE_FIREBASE_STORAGE_BUCKET=...
  VITE_FIREBASE_MESSAGING_SENDER_ID=...
  VITE_FIREBASE_APP_ID=...
  ```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Backend server shows: `✅ Firebase Admin SDK initialized successfully`
- [ ] Browser console shows: `✅ Firebase initialized successfully`
- [ ] Phone OTP login works
- [ ] OTP is received via SMS
- [ ] Can complete authentication

---

## 🚨 Common Mistakes

1. ❌ **Missing quotes around FIREBASE_PRIVATE_KEY**
   - ✅ Correct: `FIREBASE_PRIVATE_KEY="-----BEGIN..."`
   - ❌ Wrong: `FIREBASE_PRIVATE_KEY=-----BEGIN...`

2. ❌ **Removing \n from private key**
   - ✅ Keep: `\n` characters in the key
   - ❌ Don't remove them

3. ❌ **Wrong file location**
   - ✅ Frontend: `client/.env.local`
   - ❌ Not: `client/src/.env.local`

4. ❌ **Not restarting servers**
   - ✅ Restart after adding env variables
   - ❌ Old values are cached

5. ❌ **Phone number without country code**
   - ✅ Correct: `+91XXXXXXXXXX`
   - ❌ Wrong: `XXXXXXXXXX` (missing +91)

---

## 🔗 Quick Links

- Firebase Console: https://console.firebase.google.com/
- Project Settings: Gear icon → Project settings
- Authentication: Left sidebar → Authentication
- Service Accounts: Project settings → Service accounts tab

---

**For detailed steps, see: `FIREBASE_SETUP_STEP_BY_STEP.md`**
