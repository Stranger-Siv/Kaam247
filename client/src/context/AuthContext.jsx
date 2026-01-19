import { createContext, useContext, useState, useEffect } from 'react'
import { API_BASE_URL } from '../config/env'
import { persistUserLocation } from '../utils/locationPersistence'
import { reverseGeocode } from '../utils/geocoding'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check localStorage on mount for existing token
  useEffect(() => {
    const token = localStorage.getItem('kaam247_token')
    const userInfo = localStorage.getItem('kaam247_user')

    if (token && userInfo) {
      try {
        const parsedUser = JSON.parse(userInfo)
        setUser(parsedUser)
        setIsAuthenticated(true)
      } catch (error) {
        // console.error('Error parsing user info:', error)
        // Clear invalid data
        localStorage.removeItem('kaam247_token')
        localStorage.removeItem('kaam247_user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (identifier, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identifier, // email or phone
          password
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Login failed')
      }

      const data = await response.json()

      // Store token and user info
      localStorage.setItem('kaam247_token', data.token)
      localStorage.setItem('kaam247_user', JSON.stringify({
        id: data.user._id || data.user.id,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        role: data.user.role || data.user.roleMode
      }))

      setUser({
        id: data.user._id || data.user.id,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        role: data.user.role || data.user.roleMode
      })
      setIsAuthenticated(true)

      // Capture location and update profile after successful login
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

        const location = {
          lat,
          lng
        }

        // Reverse geocode via backend (avoids browser CORS + Nominatim 403) and persist
        try {
          const { area, city } = await reverseGeocode(lat, lng)
          await persistUserLocation(lat, lng, area, city)
        } catch {
          await persistUserLocation(lat, lng, null, null)
        }
        
        // Store location in localStorage for AvailabilityContext
        localStorage.setItem('kaam247_workerLocation', JSON.stringify(location))
        // Trigger location update event for AvailabilityContext
        window.dispatchEvent(new CustomEvent('location_updated', { detail: location }))
      } catch (locationError) {
        // Location capture failed - non-fatal, continue with login
        // User can still use the app, but location features won't work until they grant permission
      }

      return { success: true }
    } catch (error) {
      // console.error('Login error:', error)
      return { success: false, error: error.message }
    }
  }

  const register = async (name, email, phone, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          password
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Registration failed')
      }

      const data = await response.json()

      // Store token and user info
      localStorage.setItem('kaam247_token', data.token)
      localStorage.setItem('kaam247_user', JSON.stringify({
        id: data.user._id || data.user.id,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        role: data.user.role || data.user.roleMode
      }))

      setUser({
        id: data.user._id || data.user.id,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        role: data.user.role || data.user.roleMode
      })
      setIsAuthenticated(true)

      // Capture location and update profile after successful registration
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

        const location = {
          lat,
          lng
        }

        // Reverse geocode via backend (avoids browser CORS + Nominatim 403) and persist
        try {
          const { area, city } = await reverseGeocode(lat, lng)
          await persistUserLocation(lat, lng, area, city)
        } catch {
          await persistUserLocation(lat, lng, null, null)
        }
        
        // Store location in localStorage for AvailabilityContext
        localStorage.setItem('kaam247_workerLocation', JSON.stringify(location))
        // Trigger location update event for AvailabilityContext
        window.dispatchEvent(new CustomEvent('location_updated', { detail: location }))
      } catch (locationError) {
        // Location capture failed - non-fatal, continue with registration
        // User can still use the app, but location features won't work until they grant permission
      }

      return { success: true }
    } catch (error) {
      // console.error('Registration error:', error)
      return { success: false, error: error.message }
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUser(null)
    localStorage.removeItem('kaam247_token')
    localStorage.removeItem('kaam247_user')
    // Reset availability on logout
    localStorage.removeItem('kaam247_isOnline')
    // Clean up temporary user IDs
    localStorage.removeItem('kaam247_userId')
    localStorage.removeItem('kaam247_workerId')
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      loading,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

