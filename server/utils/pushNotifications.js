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
    const dataPayload = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [String(k), String(v)])
    )
    const link = data.url || (data.taskId ? `/tasks/${data.taskId}` : '')
    await m.send({
      token: token.trim(),
      notification: { title, body },
      data: dataPayload,
      // High priority so OS shows as heads-up / banner over other apps (like delivery apps)
      webpush: {
        headers: { Urgency: 'high' },
        fcmOptions: link ? { link } : undefined
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

/** Max workers to ping per new task (avoid rate limits and spam) */
const WORKER_PING_MAX = 80

/**
 * Worker Ping System: when a new task is posted and no workers are online,
 * send push notifications to workers (with FCM tokens) so they come online.
 * Shows distance and money in the notification.
 * Call this after response (e.g. runAfterResponse); does not block.
 * @param {object} opts - { taskId, title, budget, coordinates: [lng, lat], postedById }
 */
function pingWorkersForNewTask(opts) {
  const { taskId, title, budget, coordinates, postedById } = opts || {}
  if (!taskId || postedById == null) return

  const socketManager = require('../socket/socketManager')
  const User = require('../models/User')
  const { calculateDistance } = require('./distance')

  const taskLng = coordinates && coordinates[0] != null ? Number(coordinates[0]) : null
  const taskLat = coordinates && coordinates[1] != null ? Number(coordinates[1]) : null
  const hasLocation = taskLat != null && !isNaN(taskLat) && taskLng != null && !isNaN(taskLng)

  setImmediate(async () => {
    try {
      const onlineCount = socketManager.getOnlineWorkerCount()
      if (onlineCount > 0) {
        return
      }

      const workers = await User.find({
        role: 'user',
        status: 'active',
        _id: { $ne: postedById },
        $or: [
          { fcmToken: { $exists: true, $nin: [null, ''] } },
          { 'fcmTokens.0': { $exists: true } }
        ]
      })
        .select('_id fcmToken fcmTokens location')
        .limit(WORKER_PING_MAX)
        .lean()

      const titleText = 'New task available'
      const taskIdStr = String(taskId)
      const budgetText = typeof budget === 'number' ? `₹${budget}` : (budget != null ? `₹${Number(budget)}` : '')

      for (const worker of workers) {
        let body = budgetText ? `${budgetText}` : 'Tap to view'
        if (hasLocation && worker.location && worker.location.coordinates && worker.location.coordinates.length >= 2) {
          const [wlng, wlat] = worker.location.coordinates
          const dist = calculateDistance(taskLat, taskLng, wlat, wlng)
          body = budgetText ? `${budgetText} • ~${dist} km away` : `~${dist} km away`
        } else if (budgetText) {
          body = `${budgetText} • Tap to view`
        }
        await sendPushToUser(worker._id, titleText, body, { taskId: taskIdStr, url: `/tasks/${taskIdStr}` })
      }
    } catch (err) {
      console.error('Worker ping error:', err.message)
    }
  })
}

module.exports = {
  getAdmin,
  sendPushToToken,
  sendPushToUser,
  pingWorkersForNewTask
}
