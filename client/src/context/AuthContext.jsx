import { createContext, useContext, useState, useEffect } from 'react'
import { API_BASE_URL } from '../config/env'
import { persistUserLocation } from '../utils/locationPersistence'
import { reverseGeocode } from '../utils/geocoding'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('kaam247_token')
    const userInfo = localStorage.getItem('kaam247_user')

    if (token && userInfo) {
      try {
        const parsedUser = JSON.parse(userInfo)
        setUser(parsedUser)
        setIsAuthenticated(true)
      } catch {
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
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ identifier, password })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Login failed')
      }

      const data = await response.json()

      const userData = {
        id: data.user._id || data.user.id,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        role: data.user.role,
        roleMode: data.user.roleMode ?? 'worker',
        profileSetupCompleted: data.user.profileSetupCompleted !== false
      }
      localStorage.setItem('kaam247_token', data.token)
      localStorage.setItem('kaam247_user', JSON.stringify(userData))
      localStorage.setItem('kaam247_userMode', userData.roleMode)
      setUser(userData)
      setIsAuthenticated(true)

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
        try {
          const { area, city } = await reverseGeocode(lat, lng)
          await persistUserLocation(lat, lng, area, city)
        } catch {
          await persistUserLocation(lat, lng, null, null)
        }
        localStorage.setItem('kaam247_workerLocation', JSON.stringify({ lat, lng }))
        window.dispatchEvent(new CustomEvent('location_updated', { detail: { lat, lng } }))
      } catch {
        // Location optional
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const loginWithGoogle = async (idToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Google sign-in failed')
      }

      const data = await response.json()

      const userData = {
        id: data.user._id || data.user.id,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        role: data.user.role,
        roleMode: data.user.roleMode ?? 'worker',
        profileSetupCompleted: data.user.profileSetupCompleted === true,
        profilePhoto: data.user.profilePhoto
      }
      localStorage.setItem('kaam247_token', data.token)
      localStorage.setItem('kaam247_user', JSON.stringify(userData))
      localStorage.setItem('kaam247_userMode', userData.roleMode)
      setUser(userData)
      setIsAuthenticated(true)

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
        try {
          const { area, city } = await reverseGeocode(lat, lng)
          await persistUserLocation(lat, lng, area, city)
        } catch {
          await persistUserLocation(lat, lng, null, null)
        }
        localStorage.setItem('kaam247_workerLocation', JSON.stringify({ lat, lng }))
        window.dispatchEvent(new CustomEvent('location_updated', { detail: { lat, lng } }))
      } catch {
        // Location optional
      }

      return { success: true, profileSetupRequired: data.profileSetupRequired === true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const updateUserInContext = (updatedUser) => {
    if (!updatedUser) return
    const userData = {
      id: updatedUser._id || updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      roleMode: updatedUser.roleMode ?? user?.roleMode ?? 'worker',
      profileSetupCompleted: updatedUser.profileSetupCompleted === true,
      profilePhoto: updatedUser.profilePhoto
    }
    setUser(userData)
    localStorage.setItem('kaam247_user', JSON.stringify(userData))
  }

  const register = async (name, email, phone, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, phone, password })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Registration failed')
      }

      const data = await response.json()

      const userData = {
        id: data.user._id || data.user.id,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        role: data.user.role,
        roleMode: data.user.roleMode ?? 'worker',
        profileSetupCompleted: data.user.profileSetupCompleted !== false
      }
      localStorage.setItem('kaam247_token', data.token)
      localStorage.setItem('kaam247_user', JSON.stringify(userData))
      localStorage.setItem('kaam247_userMode', userData.roleMode)
      setUser(userData)
      setIsAuthenticated(true)

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
        try {
          const { area, city } = await reverseGeocode(lat, lng)
          await persistUserLocation(lat, lng, area, city)
        } catch {
          await persistUserLocation(lat, lng, null, null)
        }
        localStorage.setItem('kaam247_workerLocation', JSON.stringify({ lat, lng }))
        window.dispatchEvent(new CustomEvent('location_updated', { detail: { lat, lng } }))
      } catch {
        // Location optional
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Global 401 handler: when any API returns 401 (expired/invalid token), logout and clear state
  useEffect(() => {
    const handleUnauthorized = () => {
      setIsAuthenticated(false)
      setUser(null)
      localStorage.removeItem('kaam247_token')
      localStorage.removeItem('kaam247_user')
      localStorage.removeItem('kaam247_isOnline')
      localStorage.removeItem('kaam247_userId')
      localStorage.removeItem('kaam247_workerId')
      localStorage.removeItem('kaam247_userMode')
      try {
        sessionStorage.setItem('kaam247_session_expired', '1')
      } catch {
        // ignore
      }
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [])

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      })
    } catch {
      // Ignore
    }

    setIsAuthenticated(false)
    setUser(null)
    localStorage.removeItem('kaam247_token')
    localStorage.removeItem('kaam247_user')
    localStorage.removeItem('kaam247_userMode')
    localStorage.removeItem('kaam247_isOnline')
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
      logout,
      loginWithGoogle,
      updateUserInContext
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
