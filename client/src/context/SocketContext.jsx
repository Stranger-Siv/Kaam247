import { createContext, useContext, useEffect, useRef } from 'react'
// Socket.IO import - module is loaded but io() is NEVER called when SOCKET_ENABLED is false
// CRITICAL: The import statement itself doesn't create WebSocket connections
// Only calling io() creates connections, and that is prevented by SOCKET_ENABLED guard
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import { useUserMode } from './UserModeContext'
import { useAvailability } from './AvailabilityContext'
import { useNotification } from './NotificationContext'
import { SOCKET_URL, SOCKET_ENABLED, API_BASE_URL } from '../config/env'

const SocketContext = createContext()

/**
 * SocketProvider - Provides Socket.IO connection for real-time features
 * 
 * Socket.IO is ENABLED - connects to backend for real-time updates.
 * App gracefully falls back to REST APIs if socket connection fails.
 */
export function SocketProvider({ children }) {
  const { isAuthenticated, user } = useAuth()
  const { userMode } = useUserMode()
  const { isOnline, workerLocation } = useAvailability()
  const { showNotification, clearAlertedTasks } = useNotification()
  const socketRef = useRef(null)

  useEffect(() => {
    // Skip socket initialization if disabled
    if (!SOCKET_ENABLED) {
      return
    }

    // Connect socket when: logged in AND (worker mode OR poster mode)
    // Socket is OPTIONAL - app works without it using REST APIs
    if (isAuthenticated && (userMode === 'worker' || userMode === 'poster')) {
      if (!socketRef.current) {
        try {
          // Only call io() when socket is enabled and module is loaded
          socketRef.current = io(SOCKET_URL, {
            autoConnect: true,
            reconnection: true,
            transports: ['websocket'], // Enforce websocket-only (Render + HTTPS)
            forceNew: false,
            rememberUpgrade: false,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 10000,
            withCredentials: true,
            allowEIO3: true
          })
        } catch (error) {
          socketRef.current = null
          return
        }

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
          // Connection error - log once but don't spam console
          // App continues without socket, will retry automatically
          if (socketRef.current?.reconnecting === false) {
          }
        })

        // Handle reconnection attempts gracefully
        socketRef.current.on('reconnect_attempt', () => {})

        socketRef.current.on('reconnect', () => {})

        socketRef.current.on('reconnect_failed', () => {})
      } else if (!socketRef.current.connected) {
        // Reconnect if disconnected (but don't crash if it fails)
        try {
          socketRef.current.connect()
        } catch (error) {
          socketRef.current = null
        }
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
        try {
          socketRef.current.disconnect()
        } catch (error) {
          // Ignore disconnect errors
        }
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
    // Socket.IO is DISABLED - skip all socket operations
    if (!SOCKET_ENABLED) {
      return
    }

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
    // Socket.IO is DISABLED - skip all socket operations
    if (!SOCKET_ENABLED) {
      return
    }

    // Only listen if: authenticated, worker mode, and online
    if (!isAuthenticated || userMode !== 'worker' || !isOnline) {
      return
    }

    const socket = socketRef.current
    if (!socket) {
      return
    }

    const handleNewTask = async (taskData) => {
      // Double-check mode and online status before showing alert
      if (userMode !== 'worker' || !isOnline) {
        return // Ignore if mode changed or went offline
      }

      // Only alert truly idle workers: online + NO active task.
      // We re-check via backend in case local state is stale.
      try {
        const token = localStorage.getItem('kaam247_token')
        if (!token) {
          return
        }

        const res = await fetch(`${API_BASE_URL}/api/users/me/active-task`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (res.ok) {
          const data = await res.json()
          if (data?.hasActiveTask) {
            // Worker already busy on another task → skip alert
            return
          }
        }
      } catch (e) {
        // If the check fails, fail safe by NOT spamming alerts
        return
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
      if (socket) {
        try {
          socket.off('new_task', handleNewTask)
          socket.off('connect', setupListener)
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }
  }, [isAuthenticated, userMode, isOnline, showNotification])

  const getSocket = () => {
    // Socket.IO is DISABLED - always return null
    // Components should handle null socket gracefully and use REST APIs
    if (!SOCKET_ENABLED) {
      return null
    }
    // Return socket if available and connected, otherwise null
    if (socketRef.current && socketRef.current.connected) {
      return socketRef.current
    }
    return null
  }

  // Listen for task completion and status changes (for all authenticated users)
  useEffect(() => {
    // Socket.IO is DISABLED - skip all socket operations
    if (!SOCKET_ENABLED) {
      return
    }

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
      if (socket) {
        try {
          socket.off('task_completed', handleTaskCompleted)
          socket.off('task_status_changed', handleTaskStatusChanged)
          socket.off('task_cancelled', handleTaskCancelled)
          socket.off('admin_stats_refresh', handleAdminStatsRefresh)
          socket.off('task_updated', handleTaskUpdated)
          socket.off('connect', setupListeners)
        } catch (error) {
          // Ignore cleanup errors
        }
      }
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

