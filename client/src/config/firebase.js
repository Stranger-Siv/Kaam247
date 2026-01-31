/**
 * Firebase config for the client (used for FCM push notifications).
 * All values from client/.env (VITE_FIREBASE_*).
 */
import { initializeApp } from 'firebase/app'
import { getMessaging, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

let app = null
let messaging = null

export function getFirebaseApp() {
  if (app) return app
  if (!firebaseConfig.apiKey) return null
  app = initializeApp(firebaseConfig)
  return app
}

export async function getMessagingInstance() {
  const supported = await isSupported()
  if (!supported) return null
  if (messaging) return messaging
  const firebaseApp = getFirebaseApp()
  if (!firebaseApp) return null
  messaging = getMessaging(firebaseApp)
  return messaging
}

export { firebaseConfig }
