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
    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
        app = initializeApp(firebaseConfig)
        auth = getAuth(app)
        console.log('✅ Firebase initialized successfully')
    } else {
        console.warn('⚠️  Firebase configuration missing. Google authentication will be disabled.')
    }
} catch (error) {
    console.error('❌ Error initializing Firebase:', error.message)
}

// Google Auth Provider
export const googleProvider = auth ? new GoogleAuthProvider() : null

export { app, auth }
export default app
