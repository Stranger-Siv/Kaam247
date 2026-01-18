import { createContext, useContext, useState, useCallback } from 'react'

const NotificationContext = createContext()

export function NotificationProvider({ children }) {
  const [notification, setNotification] = useState(null)
  const [alertedTaskIds, setAlertedTaskIds] = useState(new Set())

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

    // Auto-dismiss after 7 seconds
    setTimeout(() => {
      setNotification(null)
    }, 7000)
  }, [alertedTaskIds])

  const hideNotification = useCallback(() => {
    setNotification(null)
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

