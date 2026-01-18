import { createContext, useContext, useState, useEffect } from 'react'
import { API_BASE_URL } from '../config/env'

const AvailabilityContext = createContext()

export function AvailabilityProvider({ children }) {
  const [isOnline, setIsOnline] = useState(false)
  const [workerLocation, setWorkerLocation] = useState(null)
  const [checkingActiveTask, setCheckingActiveTask] = useState(false)

  // Load availability from localStorage on mount
  useEffect(() => {
    const savedAvailability = localStorage.getItem('kaam247_isOnline')
    if (savedAvailability === 'true') {
      setIsOnline(true)
    }
    
    // Load saved location if available
    const savedLocation = localStorage.getItem('kaam247_workerLocation')
    if (savedLocation) {
      try {
        setWorkerLocation(JSON.parse(savedLocation))
      } catch (e) {
        // Invalid location data, ignore
      }
    }

    // Listen for location updates from other components
    const handleLocationUpdate = (event) => {
      const location = event.detail
      if (location && location.lat && location.lng) {
        setWorkerLocation(location)
        localStorage.setItem('kaam247_workerLocation', JSON.stringify(location))
      }
    }

    window.addEventListener('location_updated', handleLocationUpdate)
    return () => {
      window.removeEventListener('location_updated', handleLocationUpdate)
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

  const setOnline = async (status, onActiveTaskFound) => {
    // If trying to go offline, check for active tasks first
    if (!status && onActiveTaskFound) {
      setCheckingActiveTask(true)
      try {
        const activeTaskData = await checkActiveTask()
        
        if (activeTaskData && activeTaskData.hasActiveTask) {
          // Block going offline - call callback to show modal
          onActiveTaskFound({
            activeTaskId: activeTaskData.activeTaskId,
            activeTaskTitle: activeTaskData.activeTaskTitle,
            role: activeTaskData.role
          })
          setCheckingActiveTask(false)
          return false // Indicate offline was blocked
        }
      } catch (error) {
        console.error('Error checking active task:', error)
      } finally {
        setCheckingActiveTask(false)
      }
    }

    // No active task or going online - proceed
    setIsOnline(status)
    localStorage.setItem('kaam247_isOnline', status.toString())
    
    // If going online, capture location
    if (status) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          })
        })
        
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        
        setWorkerLocation(location)
        localStorage.setItem('kaam247_workerLocation', JSON.stringify(location))
      } catch (error) {
        // Continue without location - worker can still see tasks but without distance filtering
      }
    } else {
      // Clear location when going offline
      setWorkerLocation(null)
      localStorage.removeItem('kaam247_workerLocation')
    }
    return true // Indicate status change was successful
  }

  const resetAvailability = () => {
    setIsOnline(false)
    setWorkerLocation(null)
    localStorage.removeItem('kaam247_isOnline')
    localStorage.removeItem('kaam247_workerLocation')
  }

  return (
    <AvailabilityContext.Provider value={{ isOnline, setOnline, resetAvailability, workerLocation, checkingActiveTask }}>
      {children}
    </AvailabilityContext.Provider>
  )
}

export function useAvailability() {
  const context = useContext(AvailabilityContext)
  if (!context) {
    throw new Error('useAvailability must be used within an AvailabilityProvider')
  }
  return context
}

