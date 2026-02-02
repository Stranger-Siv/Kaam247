import { useState, useCallback, useEffect } from 'react'
import { getToken } from 'firebase/messaging'
import { getFirebaseApp, getMessagingInstance } from '../config/firebase'
import { API_BASE_URL } from '../config/env'

const VAPID_KEY = (import.meta.env.VITE_VAPID_KEY || '').trim()

/**
 * Request notification permission, get FCM token, and send to backend.
 * Call enable() when user clicks "Enable notifications".
 * Requires VITE_VAPID_KEY in client/.env (from Firebase Console > Cloud Messaging > Web Push certificates).
 */
export function usePushNotifications() {
  const [permission, setPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'default')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const updatePermission = useCallback(() => {
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission)
    }
  }, [])

  const enable = useCallback(async () => {
    if (!VAPID_KEY) {
      setError('Push notifications are not configured (missing VAPID key).')
      return false
    }
    if (typeof Notification === 'undefined') {
      setError('Notifications are not supported in this browser.')
      return false
    }
    setLoading(true)
    setError(null)
    try {
      let perm = Notification.permission
      if (perm === 'default') {
        perm = await Notification.requestPermission()
      }
      setPermission(perm)
      if (perm !== 'granted') {
        setError('Notification permission was denied.')
        setLoading(false)
        return false
      }
      getFirebaseApp()
      let registration = null
      if ('serviceWorker' in navigator) {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
        await registration.update()
      }
      const messaging = await getMessagingInstance()
      if (!messaging) {
        setError('Push is not supported in this context (e.g. insecure origin or no service worker).')
        setLoading(false)
        return false
      }
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration || undefined
      })
      if (!token) {
        setError('Could not get push token.')
        setLoading(false)
        return false
      }
      const apiUrl = `${API_BASE_URL}/api/users/me/push-subscription`
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('kaam247_token')}`
        },
        body: JSON.stringify({ token })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || data.error || 'Failed to save push subscription')
      }
      updatePermission()
      setLoading(false)
      return true
    } catch (err) {
      setError(err.message || 'Failed to enable push notifications')
      setLoading(false)
      return false
    }
  }, [])

  const disable = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const apiUrl = `${API_BASE_URL}/api/users/me/push-subscription`
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('kaam247_token')}`
        },
        body: JSON.stringify({ token: null })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || data.error || 'Failed to disable push notifications')
      }
      setLoading(false)
      return true
    } catch (err) {
      setError(err.message || 'Failed to disable push notifications')
      setLoading(false)
      return false
    }
  }, [])

  useEffect(() => {
    updatePermission()
  }, [updatePermission])

  return { permission, loading, error, enable, disable, updatePermission }
}
