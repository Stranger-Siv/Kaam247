import { createContext, useContext, useState, useEffect } from 'react'
import { API_BASE_URL } from '../config/env'
import { reverseGeocode } from '../utils/geocoding'
import { persistUserLocation } from '../utils/locationPersistence'

const AvailabilityContext = createContext()

function getInitialOnline() {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('kaam247_isOnline') === 'true'
}

function getInitialWorkerLocation() {
  if (typeof window === 'undefined') return null
  try {
    const saved = localStorage.getItem('kaam247_workerLocation')
    if (saved) return JSON.parse(saved)
  } catch {
    // ignore
  }
  return null
}

export function AvailabilityProvider({ children }) {
  const [isOnline, setIsOnline] = useState(getInitialOnline)
  const [workerLocation, setWorkerLocation] = useState(getInitialWorkerLocation)
  const [checkingActiveTask, setCheckingActiveTask] = useState(false)

  // Sync offline when session is invalid (e.g. 401 on refresh) so UI matches cleared localStorage
  useEffect(() => {
    const handleUnauthorized = () => {
      setIsOnline(false)
      setWorkerLocation(null)
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [])

  // Listen for location updates from other components
  useEffect(() => {
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
      } finally {
        setCheckingActiveTask(false)
      }
    }

    // Going online: require fresh location permission + coordinates
    if (status) {
      // If browser doesn't support geolocation, block going online
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        return false
      }

      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          })
        })

        const lat = position.coords.latitude
        const lng = position.coords.longitude

        const location = { lat, lng }

        // Save worker location locally
        setWorkerLocation(location)
        localStorage.setItem('kaam247_workerLocation', JSON.stringify(location))

        // Reverse geocode via backend and persist location in user profile
        try {
          const { area, city } = await reverseGeocode(lat, lng)
          await persistUserLocation(lat, lng, area, city)
        } catch (geocodeError) {
          // Persist coordinates even if reverse geocoding fails
          await persistUserLocation(lat, lng, null, null)
        }

        // Finally, mark user as online only after we have a location
        setIsOnline(true)
        localStorage.setItem('kaam247_isOnline', 'true')
        return true
      } catch (error) {
        return false
      }
    }

    // Going offline (and no active task blocking): clear status + location
    setIsOnline(false)
    localStorage.setItem('kaam247_isOnline', 'false')
    setWorkerLocation(null)
    localStorage.removeItem('kaam247_workerLocation')
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

