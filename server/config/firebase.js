const admin = require('firebase-admin')

// Initialize Firebase Admin SDK
let firebaseAdmin = null

try {
    // Check if Firebase credentials are provided
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        // Initialize with service account credentials from environment variables
        const serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Handle escaped newlines
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        }

        firebaseAdmin = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        })
        console.log('✅ Firebase Admin SDK initialized successfully')
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        // Alternative: Initialize with service account JSON file path
        const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
        firebaseAdmin = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        })
        console.log('✅ Firebase Admin SDK initialized from service account file')
    } else {
        console.warn('⚠️  Firebase credentials not found. Phone OTP authentication will be disabled.')
        console.warn('   Set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL in .env')
    }
} catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error.message)
    console.warn('⚠️  Phone OTP authentication will be disabled.')
}

module.exports = firebaseAdmin
