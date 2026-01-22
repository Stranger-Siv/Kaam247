# Firebase Authentication Setup Guide

This guide will help you set up Firebase Authentication for phone OTP login in Kaam247.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard:
   - Enter project name (e.g., "Kaam247")
   - Enable/disable Google Analytics (optional)
   - Click "Create project"

## Step 2: Enable Phone Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click on **Phone** provider
3. Enable it and click **Save**
4. Note: Firebase provides 10,000 free phone authentications per month

## Step 3: Get Frontend Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click the **Web** icon (`</>`) to add a web app
4. Register your app with a nickname (e.g., "Kaam247 Web")
5. Copy the Firebase configuration object

You'll get something like:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
}
```

## Step 4: Get Backend Service Account

1. In Firebase Console, go to **Project Settings** > **Service Accounts**
2. Click **Generate new private key**
3. Download the JSON file (keep it secure!)
4. You can either:
   - **Option A**: Use the JSON file directly (set `FIREBASE_SERVICE_ACCOUNT_PATH` in `.env`)
   - **Option B**: Extract values from JSON and use environment variables (recommended)

### Option B: Extract Values from Service Account JSON

Open the downloaded JSON file and extract:
- `project_id` → `FIREBASE_PROJECT_ID`
- `private_key` → `FIREBASE_PRIVATE_KEY` (keep the `\n` characters)
- `client_email` → `FIREBASE_CLIENT_EMAIL`

## Step 5: Configure Environment Variables

### Backend (server/.env)

Add these variables:

```env
# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

**Important**: The `FIREBASE_PRIVATE_KEY` must include the `\n` characters. In your `.env` file, it should look like:
```
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

### Frontend (client/.env.local)

Create `client/.env.local` and add:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

## Step 6: Install Dependencies

### Backend
```bash
cd server
npm install firebase-admin
```

### Frontend
```bash
cd client
npm install firebase
```

## Step 7: Test the Setup

1. Start your backend server:
   ```bash
   cd server
   npm run dev
   ```

2. Start your frontend:
   ```bash
   cd client
   npm run dev
   ```

3. Go to the login page and try phone OTP authentication
4. Enter your phone number (with country code, e.g., +91XXXXXXXXXX)
5. You should receive an OTP via SMS
6. Enter the OTP to complete authentication

## Troubleshooting

### "Firebase is not configured" error
- Check that all environment variables are set correctly
- Restart your server after adding environment variables
- Verify Firebase configuration in browser console

### "reCAPTCHA verification failed"
- Make sure you've enabled Phone authentication in Firebase Console
- Check browser console for reCAPTCHA errors
- Try clearing browser cache

### OTP not received
- Check phone number format (must include country code, e.g., +91)
- Verify Firebase project has phone authentication enabled
- Check Firebase Console > Authentication > Users for any errors
- Free tier has rate limits - wait a few minutes between attempts

### Backend errors
- Verify `FIREBASE_PRIVATE_KEY` includes `\n` characters
- Check that service account has proper permissions
- Ensure MongoDB is running and connected

## Security Notes

1. **Never commit** `.env` files or service account JSON files to Git
2. Keep your Firebase service account credentials secure
3. Use environment variables in production (Render, Vercel, etc.)
4. Firebase free tier: 10,000 phone authentications/month
5. After free tier: Pay-as-you-go pricing applies

## Production Deployment

### Render/Heroku/Vercel

1. Add all environment variables in your hosting platform's dashboard
2. For `FIREBASE_PRIVATE_KEY`, paste the entire key including `\n` characters
3. Restart your application after adding variables

### Example Render Environment Variables:
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@project.iam.gserviceaccount.com
```

## Next Steps

After setup:
1. Test phone OTP login flow
2. Test profile setup for new users
3. Monitor Firebase Console for usage
4. Set up billing alerts if needed

## Support

If you encounter issues:
1. Check Firebase Console for error logs
2. Check browser console for frontend errors
3. Check server logs for backend errors
4. Verify all environment variables are set correctly
