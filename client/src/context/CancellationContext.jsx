import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useUserMode } from './UserModeContext'
import { apiGet } from '../utils/api'

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
      if (!token) {
        setCancellationStatus(prev => ({ ...prev, loading: false }))
        return
      }

      const { data, error } = await apiGet('/api/users/me/cancellation-status')
      if (error) {
        // Don’t spam console for expected auth errors in dev.
        setCancellationStatus(prev => ({ ...prev, loading: false }))
        return
      }

      setCancellationStatus({
        dailyCancelCount: data.dailyCancelCount || 0,
        remainingCancellations: data.remainingCancellations || 2,
        canAcceptTasks: data.canAcceptTasks !== false,
        limitReached: data.limitReached === true,
        loading: false
      })
    } catch (error) {
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

