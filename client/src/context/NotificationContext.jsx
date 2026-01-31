import { createContext, useContext, useState, useCallback } from 'react'

const NotificationContext = createContext()

export function NotificationProvider({ children }) {
  // Queue: show one notification at a time, each new task gets its own toast in order
  const [notificationQueue, setNotificationQueue] = useState([])
  const [alertedTaskIds, setAlertedTaskIds] = useState(new Set())
  const [reminder, setReminder] = useState(null)
  const [reminderCooldown, setReminderCooldown] = useState(new Set()) // taskIds we've reminded in this session

  // Expose full list so UI can show all new tasks in one scrollable panel
  const notifications = notificationQueue
  const notification = notificationQueue[0] ?? null

  const showNotification = useCallback((taskData) => {
    // Prevent duplicate alerts
    if (alertedTaskIds.has(taskData.taskId)) {
      return // Already alerted, ignore
    }

    // Format task data for notification
    const formattedTask = {
      id: taskData.taskId,
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

    // Mark as alerted
    setAlertedTaskIds(prev => new Set([...prev, taskData.taskId]))

    // Add to queue; toast shows one at a time, dismiss shows next
    setNotificationQueue(prev => [...prev, formattedTask])
  }, [alertedTaskIds])

  const hideNotification = useCallback(() => {
    setNotificationQueue(prev => prev.slice(1))
  }, [])

  const dismissAllNotifications = useCallback(() => {
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

