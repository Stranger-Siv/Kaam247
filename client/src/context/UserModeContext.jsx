import { createContext, useContext, useState, useEffect } from 'react'
import { API_BASE_URL } from '../config/env'

const UserModeContext = createContext()

export function UserModeProvider({ children }) {
  const [userMode, setUserMode] = useState('worker')
  const [checkingActiveTask, setCheckingActiveTask] = useState(false)

  // Load mode from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('kaam247_userMode')
    if (savedMode === 'worker' || savedMode === 'poster') {
      setUserMode(savedMode)
    }
  }, [])

  const checkActiveTask = async () => {
    try {
      const token = localStorage.getItem('kaam247_token')
      if (!token) return null

      const response = await fetch(`${API_BASE_URL}/api/users/me/active-task`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        return data
      }
      return null
    } catch (error) {
      return null
    }
  }

  const toggleMode = async (onActiveTaskFound, forceOfflineCallback, isOnlineStatus) => {
    setCheckingActiveTask(true)
    try {
      const activeTaskData = await checkActiveTask()
      
      const newMode = userMode === 'worker' ? 'poster' : 'worker'

      // IMPORTANT UX RULE:
      // - If user has an active task as a WORKER, they must be able to switch into worker mode to complete it.
      // - Switching from worker -> poster while ON DUTY / active task is still blocked (to avoid abandoning tasks / breaking tracking).
      const hasActiveTask = Boolean(activeTaskData && activeTaskData.hasActiveTask)
      const activeRole = activeTaskData?.role || null // 'worker' or 'poster' (backend)

      // If switching into WORKER mode, always allow (even if active task exists)
      if (newMode === 'worker') {
        setUserMode(newMode)
        localStorage.setItem('kaam247_userMode', newMode)
        return true
      }

      // Switching into POSTER mode:
      // Block if user is online OR has an active worker task (they should finish first).
      if (isOnlineStatus || (hasActiveTask && activeRole === 'worker')) {
        if (onActiveTaskFound) {
          onActiveTaskFound({
            activeTaskId: activeTaskData?.activeTaskId || null,
            activeTaskTitle: activeTaskData?.activeTaskTitle || null,
            role: activeRole,
            isOnline: isOnlineStatus || false
          })
        }
        return false
      }

      // Allow switch into poster mode (offline + no active worker task)
      setUserMode(newMode)
      localStorage.setItem('kaam247_userMode', newMode)
      
      // If switching to POST TASK mode, force offline
      if (newMode === 'poster' && forceOfflineCallback) {
        forceOfflineCallback(false)
      }
      
      return true // Indicate switch was successful
    } catch (error) {
      return false
    } finally {
      setCheckingActiveTask(false)
    }
  }

  const setMode = (mode) => {
    if (mode === 'worker' || mode === 'poster') {
      setUserMode(mode)
      localStorage.setItem('kaam247_userMode', mode)
    }
  }

  return (
    <UserModeContext.Provider value={{ userMode, toggleMode, setMode, checkingActiveTask }}>
      {children}
    </UserModeContext.Provider>
  )
}

export function useUserMode() {
  const context = useContext(UserModeContext)
  if (!context) {
    throw new Error('useUserMode must be used within a UserModeProvider')
  }
  return context
}

