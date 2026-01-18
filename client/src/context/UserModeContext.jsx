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
      console.error('Error checking active task:', error)
      return null
    }
  }

  const toggleMode = async (onActiveTaskFound, forceOfflineCallback, isOnlineStatus) => {
    setCheckingActiveTask(true)
    try {
      const activeTaskData = await checkActiveTask()
      
      // Block mode switch if: active task exists OR user is online (ON DUTY)
      if ((activeTaskData && activeTaskData.hasActiveTask) || isOnlineStatus) {
        // Block mode switch - call callback to show modal
        if (onActiveTaskFound) {
          onActiveTaskFound({
            activeTaskId: activeTaskData?.activeTaskId || null,
            activeTaskTitle: activeTaskData?.activeTaskTitle || null,
            role: activeTaskData?.role || null,
            isOnline: isOnlineStatus || false
          })
        }
        return false // Indicate switch was blocked
      }

      // No active task and user is offline - allow switch
      const newMode = userMode === 'worker' ? 'poster' : 'worker'
      setUserMode(newMode)
      localStorage.setItem('kaam247_userMode', newMode)
      
      // If switching to POST TASK mode, force offline
      if (newMode === 'poster' && forceOfflineCallback) {
        forceOfflineCallback(false)
      }
      
      return true // Indicate switch was successful
    } catch (error) {
      console.error('Error during mode switch:', error)
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

