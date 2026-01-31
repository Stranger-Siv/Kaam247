import { createContext, useContext, useState, useCallback } from 'react'

const NotificationContext = createContext()

export function NotificationProvider({ children }) {
  const [notification, setNotification] = useState(null)
  const [alertedTaskIds, setAlertedTaskIds] = useState(new Set())
  const [reminder, setReminder] = useState(null)
  const [reminderCooldown, setReminderCooldown] = useState(new Set()) // taskIds we've reminded in this session

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

    setNotification(formattedTask)

    // Auto-dismiss after 15 seconds (toast also auto-navigates to /tasks)
    setTimeout(() => {
      setNotification(null)
    }, 15000)
  }, [alertedTaskIds])

  const hideNotification = useCallback(() => {
    setNotification(null)
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
    setNotification(null)
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        notification,
        showNotification,
        hideNotification,
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

