# Firebase Setup - Complete Step-by-Step Guide

Follow these steps exactly to set up Firebase Authentication for phone OTP login.

---

## 📋 Prerequisites

- Google account (Gmail)
- Access to your project files
- Text editor to edit `.env` files

---

## 🚀 STEP 1: Create Firebase Project

1. **Go to Firebase Console**
   - Open: https://console.firebase.google.com/
   - Sign in with your Google account

2. **Create New Project**
   - Click **"Add project"** or **"Create a project"**
   - Enter project name: `Kaam247` (or any name you prefer)
   - Click **"Continue"**

3. **Configure Google Analytics** (Optional)
   - You can enable or disable Google Analytics
   - Click **"Continue"** either way

4. **Finish Setup**
   - Wait for project creation (takes ~30 seconds)
   - Click **"Continue"** when done

✅ **You now have a Firebase project!**

---

## 📱 STEP 2: Enable Phone Authentication

1. **Open Authentication**
   - In Firebase Console, click **"Authentication"** in the left sidebar
   - If you see "Get started", click it

2. **Enable Phone Sign-in**
   - Click on the **"Sign-in method"** tab (at the top)
   - Find **"Phone"** in the list
   - Click on **"Phone"**

3. **Enable Phone Provider**
   - Toggle the **"Enable"** switch to ON
   - Click **"Save"**

✅ **Phone authentication is now enabled!**

---

## 🌐 STEP 3: Register Web App (Frontend Config)

1. **Go to Project Settings**
   - Click the **gear icon** (⚙️) next to "Project Overview"
   - Select **"Project settings"**

2. **Add Web App**
   - Scroll down to **"Your apps"** section
   - Click the **Web icon** (`</>`) - it looks like HTML brackets

3. **Register App**
   - App nickname: `Kaam247 Web` (or any name)
   - **DO NOT** check "Also set up Firebase Hosting" (unless you want it)
   - Click **"Register app"**

4. **Copy Configuration**
   - You'll see a code block with `firebaseConfig`
   - **Copy all the values** - you'll need them:
     ```javascript
     const firebaseConfig = {
       apiKey: "AIzaSyC...",           // ← Copy this
       authDomain: "kaam247.firebaseapp.com",  // ← Copy this
       projectId: "kaam247-xxxxx",     // ← Copy this
       storageBucket: "kaam247-xxxxx.appspot.com", // ← Copy this
       messagingSenderId: "123456789",  // ← Copy this
       appId: "1:123456789:web:abc123" // ← Copy this
     }
     ```
   - Click **"Continue to console"**

✅ **Frontend config is ready!**

---

## 🔐 STEP 4: Get Service Account (Backend Config)

1. **Stay in Project Settings**
   - You should still be in **Project settings** (gear icon)
   - If not, go to: Gear icon → **Project settings**

2. **Go to Service Accounts Tab**
   - Click on **"Service accounts"** tab (at the top)

3. **Generate Private Key**
   - Click **"Generate new private key"** button
   - A popup will appear - click **"Generate key"**
   - A JSON file will download automatically

4. **Open the Downloaded JSON File**
   - Find the file in your Downloads folder
   - Name will be like: `kaam247-xxxxx-firebase-adminsdk-xxxxx-xxxxx.json`
   - Open it with a text editor (VS Code, Notepad, etc.)

5. **Extract Values from JSON**
   - You'll see something like:
     ```json
     {
       "type": "service_account",
       "project_id": "kaam247-xxxxx",           // ← Copy this
       "private_key_id": "...",
       "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n",  // ← Copy ALL of this (including \n)
       "client_email": "firebase-adminsdk-xxxxx@kaam247-xxxxx.iam.gserviceaccount.com",  // ← Copy this
       ...
     }
     ```
   - Copy these 3 values:
     - `project_id`
     - `private_key` (the ENTIRE key including `-----BEGIN...` and `-----END...`)
     - `client_email`

✅ **Backend config is ready!**

---

## ⚙️ STEP 5: Configure Backend Environment Variables

1. **Open Backend .env File**
   - Navigate to: `server/.env`
   - If it doesn't exist, copy `server/.env.example` to `server/.env`

2. **Add Firebase Variables**
   - Add these lines at the end of your `.env` file:
     ```env
     # Firebase Admin SDK Configuration
     FIREBASE_PROJECT_ID=kaam247-xxxxx
     FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
     FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@kaam247-xxxxx.iam.gserviceaccount.com
     ```

3. **Important Notes:**
   - Replace the values with YOUR actual values from Step 4
   - `FIREBASE_PRIVATE_KEY` must be in quotes `"..."` 
   - Keep the `\n` characters in the private key (they're important!)
   - The private key should look like: `"-----BEGIN PRIVATE KEY-----\n...very long string...\n-----END PRIVATE KEY-----\n"`

4. **Example of Correct Format:**
   ```env
   FIREBASE_PROJECT_ID=kaam247-abc123
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-abc12@kaam247-abc123.iam.gserviceaccount.com
   ```

✅ **Backend configured!**

---

## 🎨 STEP 6: Configure Frontend Environment Variables

1. **Create Frontend .env.local File**
   - Navigate to: `client/` folder
   - Create a new file named: `.env.local`
   - (If `.env.local` exists, open it)

2. **Add Firebase Variables**
   - Add these lines:
     ```env
     # Firebase Configuration
     VITE_FIREBASE_API_KEY=AIzaSyC...
     VITE_FIREBASE_AUTH_DOMAIN=kaam247-xxxxx.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=kaam247-xxxxx
     VITE_FIREBASE_STORAGE_BUCKET=kaam247-xxxxx.appspot.com
     VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
     VITE_FIREBASE_APP_ID=1:123456789:web:abc123
     ```

3. **Replace with Your Values**
   - Use the values you copied in **Step 3** (from firebaseConfig)
   - Replace `xxxxx` with your actual project values

4. **Example:**
   ```env
   VITE_FIREBASE_API_KEY=AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz
   VITE_FIREBASE_AUTH_DOMAIN=kaam247-abc123.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=kaam247-abc123
   VITE_FIREBASE_STORAGE_BUCKET=kaam247-abc123.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=987654321
   VITE_FIREBASE_APP_ID=1:987654321:web:xyz789abc
   ```

✅ **Frontend configured!**

---

## ✅ STEP 7: Verify Installation

1. **Check Packages are Installed**
   - Backend: `server/package.json` should have `"firebase-admin": "^13.6.0"`
   - Frontend: `client/package.json` should have `"firebase": "^12.8.0"`
   - ✅ You already have these installed!

2. **Verify Environment Files**
   - Backend: `server/.env` has all 3 Firebase variables
   - Frontend: `client/.env.local` has all 6 Firebase variables

---

## 🧪 STEP 8: Test the Setup

1. **Start Backend Server**
   ```bash
   cd server
   npm run dev
   ```
   - Look for: `✅ Firebase Admin SDK initialized successfully`
   - If you see this, backend is configured correctly!

2. **Start Frontend**
   ```bash
   cd client
   npm run dev
   ```
   - Open the URL shown (usually http://localhost:5173)
   - Open browser console (F12)
   - Look for: `✅ Firebase initialized successfully`

3. **Test Phone OTP Login**
   - Go to Login page
   - Click **"Phone OTP"** tab
   - Enter your phone number: `+91XXXXXXXXXX` (with country code!)
   - Click **"Send OTP"**
   - You should receive an SMS with 6-digit code
   - Enter the code
   - If successful, you'll be logged in or asked to complete profile

✅ **Everything is working!**

---

## 🔍 Troubleshooting

### ❌ "Firebase is not configured" error

**Backend:**
- Check `server/.env` has all 3 variables
- Make sure `FIREBASE_PRIVATE_KEY` is in quotes
- Restart server after adding variables
- Check server logs for Firebase initialization message

**Frontend:**
- Check `client/.env.local` has all 6 variables
- Make sure file is named `.env.local` (not `.env`)
- Restart dev server after adding variables
- Check browser console for Firebase initialization

### ❌ "reCAPTCHA verification failed"

- Make sure Phone authentication is enabled in Firebase Console
- Clear browser cache and try again
- Check browser console for errors

### ❌ OTP not received

- Check phone number format: Must include country code (e.g., `+91XXXXXXXXXX`)
- Wait 1-2 minutes (SMS can be delayed)
- Check Firebase Console > Authentication > Users for errors
- Free tier has rate limits - wait 5 minutes between attempts

### ❌ Backend can't initialize Firebase

- Verify `FIREBASE_PRIVATE_KEY` includes `\n` characters
- Make sure private key is complete (starts with `-----BEGIN` and ends with `-----END`)
- Check that all 3 environment variables are set
- Restart server

### ❌ Frontend Firebase not initializing

- Verify all 6 environment variables in `.env.local`
- Make sure file is in `client/` folder (not `client/src/`)
- Restart dev server
- Check browser console for specific errors

---

## 📝 Quick Checklist

Before testing, verify:

- [ ] Firebase project created
- [ ] Phone authentication enabled
- [ ] Web app registered in Firebase
- [ ] Service account JSON downloaded
- [ ] Backend `.env` has 3 Firebase variables
- [ ] Frontend `.env.local` has 6 Firebase variables
- [ ] Packages installed (`firebase-admin` and `firebase`)
- [ ] Server restarted after adding env variables
- [ ] Frontend dev server restarted after adding env variables

---

## 🎉 You're Done!

Once all steps are complete:
1. Users can login with phone OTP
2. New users will be asked to complete profile
3. Existing users can use phone OTP or email/password

**Need Help?**
- Check Firebase Console for error logs
- Check browser console (F12) for frontend errors
- Check server terminal for backend errors
- Verify all environment variables are correct

---

## 🔒 Security Reminder

- **Never commit** `.env` or `.env.local` files to Git
- **Never commit** service account JSON files
- Keep Firebase credentials secure
- Use environment variables in production hosting

---

**That's it! Your Firebase setup is complete! 🚀**
