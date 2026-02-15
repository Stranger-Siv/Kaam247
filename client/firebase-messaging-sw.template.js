// Firebase Cloud Messaging service worker – receives push when app is in background.
// This file is generated at build time from firebase-messaging-sw.template.js using VITE_FIREBASE_* env vars.
// Do not commit firebase-messaging-sw.js with real keys. See client/.env.example and docs.
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: '__VITE_FIREBASE_API_KEY__',
  authDomain: '__VITE_FIREBASE_AUTH_DOMAIN__',
  projectId: '__VITE_FIREBASE_PROJECT_ID__',
  storageBucket: '__VITE_FIREBASE_STORAGE_BUCKET__',
  messagingSenderId: '__VITE_FIREBASE_MESSAGING_SENDER_ID__',
  appId: '__VITE_FIREBASE_APP_ID__'
})

const messaging = firebase.messaging()

// Keep text short for small screens so multiple notifications each show clearly without overflow
function shortText(str, maxLen) {
  if (typeof str !== 'string') return ''
  return str.length <= maxLen ? str : str.slice(0, maxLen - 3) + '...'
}

messaging.onBackgroundMessage(function (payload) {
  const rawTitle = payload.notification?.title || payload.data?.title || 'Kaam247'
  const rawBody = payload.notification?.body || payload.data?.body || ''
  const title = shortText(rawTitle, 45)
  const body = shortText(rawBody, 60)
  const data = payload.data || {}
  const taskId = data.taskId
  const isNewTask = data.type === 'new_task'

  // Unique tag per notification so multiple notifications show separately on small screens (no grouping/replace)
  const tag = taskId
    ? (isNewTask ? 'newtask-' + taskId : 'task-' + taskId)
    : 'kaam247-' + Date.now()

  const options = {
    body: body,
    icon: '/icons/kaam247_pwa.jpeg',
    data: Object.assign({}, data, taskId ? { url: '/tasks/' + taskId } : {}),
    tag: tag,
    requireInteraction: isNewTask,
    silent: false
  }
  // Alarm-style for new tasks: vibrate on supported devices (mobile)
  if (isNewTask && 'vibrate' in navigator) {
    options.vibrate = [200, 100, 200, 100, 200]
  }
  return self.registration.showNotification(title, options)
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const url = event.notification.data?.url || '/tasks'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url.indexOf(self.location.origin) === 0 && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(self.location.origin + url)
      }
    })
  )
})
