/**
 * Firebase Cloud Messaging (FCM) push notifications.
 * Uses FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY from env.
 */
let admin = null
let messaging = null

function getAdmin() {
  if (admin) return admin
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
  if (!projectId || !clientEmail || !privateKey) {
    return null
  }
  try {
    const firebaseAdmin = require('firebase-admin')
    if (firebaseAdmin.apps.length > 0) return firebaseAdmin
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert({
        projectId,
        clientEmail,
        privateKey: (privateKey || '').replace(/\\n/g, '\n')
      })
    })
    admin = firebaseAdmin
    messaging = firebaseAdmin.messaging()
    return admin
  } catch (err) {
    console.error('Firebase Admin init error:', err.message)
    return null
  }
}

/**
 * Send a push notification to a single FCM token.
 * @param {string} token - FCM device token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional data payload (e.g. { taskId, type, url })
 * @returns {Promise<boolean>} - true if sent, false if skipped/failed
 */
async function sendPushToToken(token, title, body, data = {}) {
  if (!token || typeof token !== 'string' || !token.trim()) return false
  const m = getAdmin() && messaging
  if (!m) return false
  try {
    await m.send({
      token: token.trim(),
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [String(k), String(v)])
      ),
      webpush: {
        fcmOptions: {
          link: data.url || data.taskId ? `/tasks/${data.taskId || ''}` : undefined
        }
      }
    })
    return true
  } catch (err) {
    if (err.code === 'messaging/invalid-registration-token' || err.code === 'messaging/registration-token-not-registered') {
      // Token invalid – caller may want to clear it from user
    }
    return false
  }
}

/**
 * Send push to a user by userId (all registered devices: phone, Chrome, etc.).
 * Uses fcmTokens array; falls back to fcmToken for backward compatibility.
 */
async function sendPushToUser(userId, title, body, data = {}) {
  if (!userId) return false
  const User = require('../models/User')
  const user = await User.findById(userId).select('fcmToken fcmTokens').lean()
  if (!user) return false
  const tokens = (user.fcmTokens && user.fcmTokens.length)
    ? user.fcmTokens
    : (user.fcmToken ? [user.fcmToken] : [])
  if (tokens.length === 0) return false
  let anySent = false
  for (const token of tokens) {
    if (!token || !token.trim()) continue
    const sent = await sendPushToToken(token.trim(), title, body, data)
    if (sent) anySent = true
  }
  return anySent
}

module.exports = {
  getAdmin,
  sendPushToToken,
  sendPushToUser
}
