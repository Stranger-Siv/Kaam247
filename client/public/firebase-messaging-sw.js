// Firebase Cloud Messaging service worker – receives push when app is in background.
// Replace the config below with your values from client/.env (VITE_FIREBASE_*).
// Must be served from same origin as your app (e.g. https://yoursite.com/firebase-messaging-sw.js).
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyAU579I7JLAWkFpTp4ShmvSuSaILfejqC4',
  authDomain: 'kaam247-98b09.firebaseapp.com',
  projectId: 'kaam247-98b09',
  storageBucket: 'kaam247-98b09.firebasestorage.app',
  messagingSenderId: '108028437426',
  appId: '1:108028437426:web:a4e4bc89f1e08e164d3aab'
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
    icon: '/icons/kaam247_pwa_new.png',
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
