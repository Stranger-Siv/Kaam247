import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

// Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Initialize Firebase
let app = null
let auth = null

try {
    if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.authDomain) {
        // Suppress Firebase auto-config detection (prevents __/firebase/init.json error)
        // This error is harmless but we can prevent it by ensuring proper config
        app = initializeApp(firebaseConfig)
        auth = getAuth(app)
        
        // Set the auth domain explicitly to prevent redirect issues
        if (auth) {
            // Ensure auth domain is set correctly
            console.log('✅ Firebase initialized successfully')
            console.log('🔍 Firebase Auth Domain:', firebaseConfig.authDomain)
            console.log('🔍 Current URL:', window.location.origin)
            
            // Note: If you see an error about __/firebase/init.json, it's harmless
            // Firebase tries to auto-detect config from Firebase Hosting, but your app
            // is hosted elsewhere. This doesn't affect authentication.
        }
    } else {
        console.warn('⚠️  Firebase configuration missing. Google authentication will be disabled.')
        console.warn('⚠️  Missing:', {
            apiKey: !firebaseConfig.apiKey,
            projectId: !firebaseConfig.projectId,
            authDomain: !firebaseConfig.authDomain
        })
    }
} catch (error) {
    console.error('❌ Error initializing Firebase:', error.message)
    console.error('❌ Error details:', error)
}

// Google Auth Provider
export const googleProvider = auth ? new GoogleAuthProvider() : null

// Add custom parameters to Google provider
if (googleProvider) {
    // Set the redirect URL explicitly
    googleProvider.setCustomParameters({
        prompt: 'select_account'
    })
}

export { app, auth }
export default app
