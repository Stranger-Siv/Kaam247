import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { initNotificationSound, startNotificationAlertLoop, stopNotificationAlertLoop } from '../utils/notificationSound'

const NEW_TASK_ALERT_DURATION_MS = 15 * 1000 // 15 seconds per task - each task has its own independent timer

const NotificationContext = createContext()

export function NotificationProvider({ children }) {
  const [notificationQueue, setNotificationQueue] = useState([])
  const timersByTaskIdRef = useRef({}) // { [taskId]: timeoutId } - one timer per task, run simultaneously

  useEffect(() => {
    initNotificationSound()
  }, [])
  const [alertedTaskIds, setAlertedTaskIds] = useState(new Set())
  const [reminder, setReminder] = useState(null)
  const [reminderCooldown, setReminderCooldown] = useState(new Set())

  const notifications = notificationQueue
  const notification = notificationQueue[0] ?? null

  // Called when a single task's 15s timer expires - remove only that task; other timers keep running
  const expireTask = useCallback((taskId) => {
    if (timersByTaskIdRef.current[taskId] != null) {
      clearTimeout(timersByTaskIdRef.current[taskId])
      delete timersByTaskIdRef.current[taskId]
    }
    setNotificationQueue(prev => {
      const next = prev.filter(t => t.id !== taskId)
      if (next.length === 0) stopNotificationAlertLoop()
      return next
    })
  }, [])

  const showNotification = useCallback((taskData) => {
    const rawId = taskData.taskId ?? taskData._id ?? taskData.id
    const taskId = rawId != null ? String(rawId) : ''
    if (!taskId) return

    if (alertedTaskIds.has(taskId)) return

    const formattedTask = {
      id: taskId,
      title: taskData.title,
      category: taskData.category,
      budget: taskData.budget,
      distanceKm: taskData.distanceKm,
      distance: taskData.distanceKm !== null && taskData.distanceKm !== undefined
        ? `${taskData.distanceKm} km away`
        : null,
      location: taskData.location?.area
        ? `${taskData.location.area}${taskData.location.city ? `, ${taskData.location.city}` : ''}`
        : 'Location not specified',
      createdAt: taskData.createdAt || new Date().toISOString()
    }

    setAlertedTaskIds(prev => new Set([...prev, taskId]))

    if (typeof window !== 'undefined' && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        const body = [formattedTask.title, formattedTask.distance].filter(Boolean).join(' • ')
        const sys = new Notification('🔔 New Task Available', {
          body: body || formattedTask.title,
          icon: '/icons/icon-192.png',
          tag: 'new-task-' + taskId,
          requireInteraction: true
        })
        sys.onclick = () => {
          window.focus()
          sys.close()
          if (window.location.pathname !== `/tasks/${taskId}`) {
            window.location.href = `/tasks/${taskId}`
          }
        }
      } catch (_) { }
    }

    const wasEmpty = notificationQueue.length === 0
    setNotificationQueue(prev => [...prev, formattedTask])

    if (wasEmpty) startNotificationAlertLoop()

    const timeoutId = setTimeout(() => {
      expireTask(taskId)
    }, NEW_TASK_ALERT_DURATION_MS)
    timersByTaskIdRef.current[taskId] = timeoutId
  }, [alertedTaskIds, notificationQueue.length, expireTask])

  const dismissTask = useCallback((taskId) => {
    if (timersByTaskIdRef.current[taskId] != null) {
      clearTimeout(timersByTaskIdRef.current[taskId])
      delete timersByTaskIdRef.current[taskId]
    }
    setNotificationQueue(prev => {
      const next = prev.filter(t => t.id !== taskId)
      if (next.length === 0) stopNotificationAlertLoop()
      return next
    })
  }, [])

  const hideNotification = useCallback(() => {
    const first = notificationQueue[0]
    if (first) dismissTask(first.id)
  }, [notificationQueue, dismissTask])

  const dismissAllNotifications = useCallback(() => {
    const timers = timersByTaskIdRef.current
    Object.keys(timers).forEach(taskId => {
      if (timers[taskId] != null) clearTimeout(timers[taskId])
    })
    timersByTaskIdRef.current = {}
    stopNotificationAlertLoop()
    setNotificationQueue([])
  }, [])

  const showReminder = useCallback(({ title, message, taskId }) => {
    if (taskId && reminderCooldown.has(taskId)) return
    setReminder({ title, message, taskId })
    if (taskId) setReminderCooldown(prev => new Set([...prev, taskId]))
    setTimeout(() => setReminder(null), 8000)
  }, [reminderCooldown])

  const hideReminder = useCallback(() => {
    setReminder(null)
  }, [])

  const clearAlertedTasks = useCallback(() => {
    const timers = timersByTaskIdRef.current
    Object.keys(timers).forEach(taskId => {
      if (timers[taskId] != null) clearTimeout(timers[taskId])
    })
    timersByTaskIdRef.current = {}
    stopNotificationAlertLoop()
    setAlertedTaskIds(new Set())
    setNotificationQueue([])
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        notification,
        notifications,
        showNotification,
        hideNotification,
        dismissTask,
        dismissAllNotifications,
        reminder,
        showReminder,
        hideReminder,
        clearAlertedTasks
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}
