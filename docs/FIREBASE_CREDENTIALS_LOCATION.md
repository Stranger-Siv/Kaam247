# Where to Find All Firebase Credentials - Step by Step

This guide shows you EXACTLY where to find each Firebase credential in the Firebase Console.

---

## 🎯 Overview

You need **2 sets of credentials**:
1. **Backend credentials** (Service Account) - 3 values
2. **Frontend credentials** (Web App Config) - 6 values

---

## 📍 PART 1: Backend Credentials (Service Account)

**What you need:**
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`

**Where to find them:**

### Step 1: Open Firebase Console
1. Go to: https://console.firebase.google.com/
2. Sign in with your Google account
3. Select your project (or create one if you haven't)

### Step 2: Go to Project Settings
1. Look at the **top left** of the page
2. You'll see your project name
3. Next to it, click the **Gear icon** (⚙️)
4. Click **"Project settings"** from the dropdown

### Step 3: Navigate to Service Accounts Tab
1. You'll see several tabs at the top:
   - General
   - **Service accounts** ← Click this one
   - Users and permissions
   - etc.

### Step 4: Generate Private Key
1. In the **Service accounts** tab, you'll see:
   - A section titled "Firebase Admin SDK"
   - A dropdown that says "Node.js" (or similar)
   - A button that says **"Generate new private key"**

2. Click **"Generate new private key"** button

3. A popup will appear warning you about security
   - Click **"Generate key"** to confirm

4. A JSON file will **automatically download** to your computer
   - File name will be like: `kaam247-xxxxx-firebase-adminsdk-xxxxx-xxxxx.json`
   - It will be in your **Downloads** folder

### Step 5: Open the Downloaded JSON File
1. Go to your **Downloads** folder
2. Find the JSON file (it will have a long name)
3. **Open it** with any text editor:
   - VS Code
   - Notepad
   - TextEdit (Mac)
   - Any text editor

### Step 6: Extract Values from JSON
The JSON file will look like this:

```json
{
  "type": "service_account",
  "project_id": "kaam247-abc123",                    ← Copy this
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",  ← Copy ALL of this (entire key)
  "client_email": "firebase-adminsdk-abc12@kaam247-abc123.iam.gserviceaccount.com",  ← Copy this
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-abc12%40kaam247-abc123.iam.gserviceaccount.com"
}
```

**Copy these 3 values:**
1. `project_id` → This is your `FIREBASE_PROJECT_ID`
2. `private_key` → This is your `FIREBASE_PRIVATE_KEY` (copy the ENTIRE thing including `-----BEGIN...` and `-----END...`)
3. `client_email` → This is your `FIREBASE_CLIENT_EMAIL`

**Important:** 
- The `private_key` is very long (multiple lines)
- Copy it COMPLETELY from `-----BEGIN PRIVATE KEY-----` to `-----END PRIVATE KEY-----`
- Keep the `\n` characters (they represent newlines)

---

## 📍 PART 2: Frontend Credentials (Web App Config)

**What you need:**
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

**Where to find them:**

### Step 1: Stay in Project Settings
1. You should still be in **Project settings**
2. If not, go to: Gear icon (⚙️) → **Project settings**

### Step 2: Go to General Tab
1. Click the **"General"** tab (first tab at the top)
2. Scroll down the page

### Step 3: Find "Your apps" Section
1. Keep scrolling down
2. You'll see a section titled **"Your apps"**
3. It might show:
   - "Add app" button
   - Or existing apps if you've added any

### Step 4: Add Web App (if not already added)
1. If you see **"Add app"** or no apps listed:
   - Click the **Web icon** (`</>`) - it looks like HTML brackets
   - If you don't see it, look for a button that says **"Add app"** or **"</>"**

2. A popup will appear:
   - **App nickname:** Enter "Kaam247 Web" (or any name)
   - **DO NOT** check "Also set up Firebase Hosting" (unless you want it)
   - Click **"Register app"**

### Step 5: Copy Firebase Config
1. After registering, you'll see a code block that looks like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz",           ← Copy this
  authDomain: "kaam247-abc123.firebaseapp.com",                    ← Copy this
  projectId: "kaam247-abc123",                                      ← Copy this
  storageBucket: "kaam247-abc123.appspot.com",                     ← Copy this
  messagingSenderId: "987654321",                                   ← Copy this
  appId: "1:987654321:web:xyz789abc"                              ← Copy this
};
```

2. **Copy each value** and map them to your environment variables:
   - `apiKey` → `VITE_FIREBASE_API_KEY`
   - `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `VITE_FIREBASE_PROJECT_ID`
   - `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `VITE_FIREBASE_APP_ID`

3. Click **"Continue to console"** when done

### Step 6: If App Already Exists
If you already added a web app:
1. In the **"Your apps"** section, you'll see your app listed
2. Click on the **Settings icon** (⚙️) next to your app
3. Or click on the app name
4. You'll see the `firebaseConfig` code block
5. Copy the values from there

---

## 📝 Visual Navigation Path

### For Backend Credentials:
```
Firebase Console
  → Select Project
  → Gear Icon (⚙️) [Top Left]
  → Project settings
  → Service accounts tab
  → Generate new private key
  → Download JSON file
  → Open JSON file
  → Copy: project_id, private_key, client_email
```

### For Frontend Credentials:
```
Firebase Console
  → Select Project
  → Gear Icon (⚙️) [Top Left]
  → Project settings
  → General tab
  → Scroll to "Your apps" section
  → Click Web icon (</>) OR Settings icon (⚙️) on existing app
  → Copy firebaseConfig values
```

---

## 🎯 Quick Reference: What Goes Where

### Backend (`server/.env`)
```env
FIREBASE_PROJECT_ID=kaam247-abc123                    ← From JSON: project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"  ← From JSON: private_key (entire key)
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-abc12@kaam247-abc123.iam.gserviceaccount.com  ← From JSON: client_email
```

### Frontend (`client/.env.local`)
```env
VITE_FIREBASE_API_KEY=AIzaSyC...                      ← From firebaseConfig: apiKey
VITE_FIREBASE_AUTH_DOMAIN=kaam247-abc123.firebaseapp.com  ← From firebaseConfig: authDomain
VITE_FIREBASE_PROJECT_ID=kaam247-abc123                ← From firebaseConfig: projectId
VITE_FIREBASE_STORAGE_BUCKET=kaam247-abc123.appspot.com  ← From firebaseConfig: storageBucket
VITE_FIREBASE_MESSAGING_SENDER_ID=987654321            ← From firebaseConfig: messagingSenderId
VITE_FIREBASE_APP_ID=1:987654321:web:xyz789abc         ← From firebaseConfig: appId
```

---

## ⚠️ Important Notes

1. **Private Key Format:**
   - Must be in quotes: `"-----BEGIN..."`
   - Keep all `\n` characters
   - Copy the ENTIRE key from BEGIN to END

2. **Project ID Should Match:**
   - Backend `FIREBASE_PROJECT_ID` should match Frontend `VITE_FIREBASE_PROJECT_ID`
   - They should be the same value

3. **File Locations:**
   - Backend: `server/.env`
   - Frontend: `client/.env.local` (NOT `.env`)

4. **Security:**
   - Never share your private key
   - Never commit `.env` files to Git
   - Keep the JSON file secure

---

## 🔍 Can't Find Something?

### Can't find "Service accounts" tab?
- Make sure you're in **Project settings** (not User settings)
- Look for tabs at the top of the settings page
- It should be the second tab after "General"

### Can't find "Your apps" section?
- Make sure you're in the **General** tab
- Scroll down - it's usually near the bottom
- If you don't see it, you may need to add a web app first

### Private key download not working?
- Check your browser's download folder
- Some browsers block downloads - check browser settings
- Try a different browser if needed

### JSON file looks wrong?
- Make sure you downloaded the **Service Account** key (not OAuth client)
- The file should start with `{"type": "service_account", ...}`

---

## ✅ Verification

After copying all values:

1. **Backend:** Check `server/.env` has 3 Firebase variables
2. **Frontend:** Check `client/.env.local` has 6 Firebase variables
3. **Project ID:** Both should have the same `FIREBASE_PROJECT_ID` / `VITE_FIREBASE_PROJECT_ID`
4. **Private Key:** Should be in quotes and include `\n` characters

---

**That's exactly where to find everything! 🎉**

If you're still stuck, let me know which step you're on and I'll help you navigate!
