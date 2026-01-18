import { createContext, useContext, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import { useUserMode } from './UserModeContext'
import { useAvailability } from './AvailabilityContext'
import { useNotification } from './NotificationContext'
import { SOCKET_URL } from '../config/env'

const SocketContext = createContext()

export function SocketProvider({ children }) {
  const { isAuthenticated, user } = useAuth()
  const { userMode } = useUserMode()
  const { isOnline, workerLocation } = useAvailability()
  const { showNotification, clearAlertedTasks } = useNotification()
  const socketRef = useRef(null)

  useEffect(() => {
    // Connect socket when: logged in AND (worker mode OR poster mode)
    if (isAuthenticated && (userMode === 'worker' || userMode === 'poster')) {
      if (!socketRef.current) {
        socketRef.current = io(SOCKET_URL, {
          autoConnect: true,
          reconnection: true
        })

        socketRef.current.on('connect', () => {
          // Use authenticated user's ID
          const userId = user?.id

          if (!userId) {
            return
          }

          // Store userId on socket for later use
          socketRef.current.userId = userId

          // STATE RECOVERY: Emit clientConnected with full user context
          socketRef.current.emit('clientConnected', {
            userId: userId,
            role: userMode === 'worker' ? 'worker' : 'poster',
            mode: userMode,
            isOnline: isOnline,
            location: workerLocation
          })

          // Register based on current mode
          if (userMode === 'worker') {
            // Register worker (only if online)
            if (isOnline) {
              socketRef.current.emit('worker_online', {
                userId: userId,
                location: workerLocation,
                radius: 5 // Default 5 km radius
              })
            }
          } else if (userMode === 'poster') {
            // Register user (for poster notifications)
            socketRef.current.emit('user_online', { userId: userId })
          }

          // STATE RECOVERY: Trigger recovery event for pages to resync
          window.dispatchEvent(new CustomEvent('socket_reconnected', {
            detail: { userId, userMode, isOnline }
          }))
        })

        socketRef.current.on('disconnect', () => {
          // STATE RECOVERY: On disconnect, DO NOT change task state
          // Only notify that socket is disconnected
          // Pages should continue to work via API calls
        })

        socketRef.current.on('connect_error', (error) => {
          // Connection error handled silently
        })
      } else if (!socketRef.current.connected) {
        // Reconnect if disconnected
        socketRef.current.connect()
      } else if (socketRef.current.connected) {
        // Socket is connected, re-register based on current mode
        const userId = user?.id
        if (userId) {
          // Store userId on socket
          socketRef.current.userId = userId

          if (userMode === 'worker') {
            // If switching to worker mode, register as worker (only if online)
            if (isOnline) {
              socketRef.current.emit('worker_online', {
                userId: userId,
                location: workerLocation,
                radius: 5
              })
            } else {
              // If offline, ensure worker is offline
              socketRef.current.emit('worker_offline')
            }
          } else if (userMode === 'poster') {
            // If switching to poster mode, register as user
            socketRef.current.emit('user_online', { userId: userId })
            // Also emit worker_offline to remove from worker list if was a worker
            socketRef.current.emit('worker_offline')
          }
        }
      }
    } else {
      // Disconnect if not logged in
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }

    // Cleanup on unmount
    return () => {
      // Only cleanup on unmount, not on every dependency change
      // The dependency changes are handled above
    }
  }, [isAuthenticated, userMode, user, isOnline])

  // Handle online/offline toggle (only for workers)
  useEffect(() => {
    if (!isAuthenticated || userMode !== 'worker' || !user?.id) {
      return
    }

    const socket = socketRef.current
    if (!socket) {
      return
    }

    // Wait for connection if not connected yet
    if (!socket.connected) {
      socket.once('connect', () => {
        if (isOnline) {
          socket.emit('worker_online', {
            userId: user.id,
            location: workerLocation,
            radius: 5
          })
        } else {
          socket.emit('worker_offline')
        }
      })
      return
    }

    // If connected, emit immediately
    if (isOnline) {
      socket.emit('worker_online', {
        userId: user.id,
        location: workerLocation,
        radius: 5
      })
    } else {
      socket.emit('worker_offline')
    }
  }, [isOnline, isAuthenticated, userMode, user, workerLocation])

  // Clear alerted tasks when going offline or switching modes
  useEffect(() => {
    if (!isAuthenticated || userMode !== 'worker' || !isOnline) {
      // Clear alerts when not in worker mode or offline
      clearAlertedTasks()
    }
  }, [isAuthenticated, userMode, isOnline, clearAlertedTasks])

  // Listen for new_task events (only for online workers in PERFORM_TASKS mode)
  useEffect(() => {
    // Only listen if: authenticated, worker mode, and online
    if (!isAuthenticated || userMode !== 'worker' || !isOnline) {
      return
    }

    const socket = socketRef.current
    if (!socket) {
      return
    }

    const handleNewTask = (taskData) => {
      // Double-check mode and online status before showing alert
      if (userMode !== 'worker' || !isOnline) {
        return // Ignore if mode changed or went offline
      }

      // Show global notification (NotificationContext handles duplicates)
      showNotification(taskData)
    }

    // Set up listener when socket connects
    const setupListener = () => {
      if (socket.connected && isAuthenticated && userMode === 'worker' && isOnline) {
        socket.on('new_task', handleNewTask)
      }
    }

    if (socket.connected) {
      setupListener()
    } else {
      socket.once('connect', setupListener)
    }

    return () => {
      socket.off('new_task', handleNewTask)
      socket.off('connect', setupListener)
    }
  }, [isAuthenticated, userMode, isOnline, showNotification])

  const getSocket = () => {
    return socketRef.current
  }

  // Listen for task completion and status changes (for all authenticated users)
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return
    }

    const socket = socketRef.current
    if (!socket) {
      return
    }

    const handleTaskCompleted = (data) => {
      // STATE RECOVERY: Emit event AND trigger refetch after delay
      window.dispatchEvent(new CustomEvent('task_completed', { detail: data }))
      
      // Silent refetch after 500ms to ensure fresh data
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('refetch_required', { detail: { type: 'task_completed', taskId: data.taskId } }))
      }, 500)
    }

    const handleTaskStatusChanged = (data) => {
      // STATE RECOVERY: Emit event AND trigger refetch after delay
      window.dispatchEvent(new CustomEvent('task_status_changed', { detail: data }))
      
      // Silent refetch after 500ms to ensure fresh data
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('refetch_required', { detail: { type: 'task_status_changed', taskId: data.taskId } }))
      }, 500)
    }

    const handleTaskCancelled = (data) => {
      // STATE RECOVERY: Emit event AND trigger refetch after delay
      window.dispatchEvent(new CustomEvent('task_cancelled', { detail: data }))
      
      // Silent refetch after 500ms to ensure fresh data
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('refetch_required', { detail: { type: 'task_cancelled', taskId: data.taskId } }))
      }, 500)
    }

    const handleAdminStatsRefresh = () => {
      // Emit custom event for admin stats refresh
      window.dispatchEvent(new Event('admin_stats_refresh'))
    }

    const handleTaskUpdated = (data) => {
      // STATE RECOVERY: Emit event AND trigger refetch after delay
      window.dispatchEvent(new CustomEvent('task_updated', { detail: data }))
      
      // Silent refetch after 500ms to ensure fresh data
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('refetch_required', { detail: { type: 'task_updated', taskId: data.taskId } }))
      }, 500)
    }

    const setupListeners = () => {
      if (socket.connected) {
        socket.on('task_completed', handleTaskCompleted)
        socket.on('task_status_changed', handleTaskStatusChanged)
        socket.on('task_cancelled', handleTaskCancelled)
        socket.on('admin_stats_refresh', handleAdminStatsRefresh)
        socket.on('task_updated', handleTaskUpdated)
      }
    }

    if (socket.connected) {
      setupListeners()
    } else {
      socket.once('connect', setupListeners)
    }

    return () => {
      socket.off('task_completed', handleTaskCompleted)
      socket.off('task_status_changed', handleTaskStatusChanged)
      socket.off('task_cancelled', handleTaskCancelled)
      socket.off('admin_stats_refresh', handleAdminStatsRefresh)
      socket.off('task_updated', handleTaskUpdated)
      socket.off('connect', setupListeners)
    }
  }, [isAuthenticated, user?.id])

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, getSocket }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

