import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useUserMode } from './UserModeContext'
import { API_BASE_URL } from '../config/env'

const CancellationContext = createContext()

export const useCancellation = () => {
  const context = useContext(CancellationContext)
  if (!context) {
    throw new Error('useCancellation must be used within CancellationProvider')
  }
  return context
}

export const CancellationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  const { userMode } = useUserMode()
  const [cancellationStatus, setCancellationStatus] = useState({
    dailyCancelCount: 0,
    remainingCancellations: 2,
    canAcceptTasks: true,
    limitReached: false,
    loading: true
  })

  const fetchCancellationStatus = async () => {
    // Only fetch for authenticated workers
    if (!isAuthenticated || userMode !== 'worker' || !user?.id) {
      setCancellationStatus(prev => ({ ...prev, loading: false }))
      return
    }

    try {
      const token = localStorage.getItem('kaam247_token')
      const response = await fetch(`${API_BASE_URL}/api/users/me/cancellation-status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCancellationStatus({
          dailyCancelCount: data.dailyCancelCount || 0,
          remainingCancellations: data.remainingCancellations || 2,
          canAcceptTasks: data.canAcceptTasks !== false,
          limitReached: data.limitReached === true,
          loading: false
        })
      } else {
        setCancellationStatus(prev => ({ ...prev, loading: false }))
      }
    } catch (error) {
      console.error('Error fetching cancellation status:', error)
      setCancellationStatus(prev => ({ ...prev, loading: false }))
    }
  }

  useEffect(() => {
    fetchCancellationStatus()
    // Refresh every minute to catch day changes
    const interval = setInterval(fetchCancellationStatus, 60000)
    return () => clearInterval(interval)
  }, [isAuthenticated, userMode, user?.id])

  const refreshStatus = () => {
    fetchCancellationStatus()
  }

  return (
    <CancellationContext.Provider
      value={{
        cancellationStatus,
        refreshStatus
      }}
    >
      {children}
    </CancellationContext.Provider>
  )
}

