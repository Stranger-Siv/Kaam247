import { createContext, useContext, useState, useEffect } from 'react'
import { API_BASE_URL } from '../config/env'
import { persistUserLocation } from '../utils/locationPersistence'
import { reverseGeocode } from '../utils/geocoding'
import { auth, googleProvider } from '../config/firebase'
import { signInWithRedirect, getRedirectResult } from 'firebase/auth'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check localStorage on mount for existing token
  useEffect(() => {
    const initializeAuth = async () => {
      let redirectHandled = false
      
      // Check for Google redirect result FIRST (before checking existing tokens)
      if (auth && googleProvider) {
        try {
          // Check URL for redirect indicators
          const urlParams = new URLSearchParams(window.location.search)
          const hasAuthParams = urlParams.has('apiKey') || urlParams.has('mode') || window.location.hash.includes('auth')
          console.log('🔍 [AuthContext] Checking redirect result. URL params:', {
            search: window.location.search,
            hash: window.location.hash,
            hasAuthParams
          })
          
          // Wait a bit for Firebase to process the redirect
          await new Promise(resolve => setTimeout(resolve, 100))
          
          const result = await getRedirectResult(auth)
          console.log('📋 [AuthContext] getRedirectResult returned:', result ? 'Result found' : 'No result')
          if (result) {
            console.log('✅ [AuthContext] Redirect result details:', {
              user: result.user?.email,
              providerId: result.providerId,
              operationType: result.operationType
            })
          }
          
          if (result) {
            redirectHandled = true
            // User just returned from Google sign-in redirect
            const userCredential = result.user
            console.log('👤 [AuthContext] User credential from redirect:', {
              uid: userCredential.uid,
              email: userCredential.email,
              displayName: userCredential.displayName
            })
            const idToken = await userCredential.getIdToken()
            console.log('🔑 [AuthContext] Got Firebase ID token (length:', idToken.length, ')')

            // Send ID token to backend
            const response = await fetch(`${API_BASE_URL}/api/auth/google/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                idToken
              })
            })

            if (response.ok) {
              const data = await response.json()
              localStorage.setItem('kaam247_token', data.token)
              localStorage.setItem('kaam247_user', JSON.stringify({
                id: data.user._id || data.user.id,
                name: data.user.name,
                email: data.user.email,
                phone: data.user.phone,
                role: data.user.role || data.user.roleMode,
                profilePhoto: data.user.profilePhoto,
                profileSetupCompleted: data.user.profileSetupCompleted
              }))

              setUser({
                id: data.user._id || data.user.id,
                name: data.user.name,
                email: data.user.email,
                phone: data.user.phone,
                role: data.user.role || data.user.roleMode,
                profilePhoto: data.user.profilePhoto,
                profileSetupCompleted: data.user.profileSetupCompleted
              })
              setIsAuthenticated(true)

              // Capture location if available (non-blocking)
              try {
                const position = await new Promise((resolve, reject) => {
                  navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                  })
                })

                const lat = position.coords.latitude
                const lng = position.coords.longitude
                const location = { lat, lng }

                try {
                  const { area, city } = await reverseGeocode(lat, lng)
                  await persistUserLocation(lat, lng, area, city)
                } catch {
                  await persistUserLocation(lat, lng, null, null)
                }
                
                localStorage.setItem('kaam247_workerLocation', JSON.stringify(location))
                window.dispatchEvent(new CustomEvent('location_updated', { detail: location }))
              } catch (locationError) {
                // Location capture failed - non-fatal, continue
              }

              // Trigger navigation event AFTER state is set
              setTimeout(() => {
                console.log('📢 [AuthContext] Dispatching googleSignInSuccess event')
                window.dispatchEvent(new CustomEvent('googleSignInSuccess', { 
                  detail: { 
                    requiresProfileSetup: data.requiresProfileSetup || false,
                    user: data.user 
                  } 
                }))
              }, 200)
              
              // Set loading to false AFTER authentication is complete
              setLoading(false)
              console.log('✅ [AuthContext] Authentication complete, loading set to false')
              return
            } else {
              // Handle error response
              const errorData = await response.json().catch(() => ({ message: 'Authentication failed' }))
              console.error('❌ [AuthContext] Google authentication failed:', errorData)
              window.dispatchEvent(new CustomEvent('googleSignInError', { 
                detail: { 
                  error: errorData.message || 'Failed to authenticate with Google'
                } 
              }))
              setLoading(false)
              return
            }
          } else {
            console.log('ℹ️ [AuthContext] No Google redirect result found')
          }
        } catch (error) {
          console.error('❌ [AuthContext] Error handling redirect result:', error)
          // Continue to check for existing tokens even if redirect fails
        }
      } else {
        console.log('⚠️ [AuthContext] Firebase auth or googleProvider not available')
      }

      // Only check for existing token if redirect was not handled
      if (!redirectHandled) {
        console.log('🔍 [AuthContext] Checking for existing token in localStorage...')
        const token = localStorage.getItem('kaam247_token')
        const userInfo = localStorage.getItem('kaam247_user')

        if (token && userInfo) {
          console.log('✅ [AuthContext] Found existing token and user info')
          try {
            const parsedUser = JSON.parse(userInfo)
            console.log('👤 [AuthContext] Restoring user from localStorage:', {
              id: parsedUser.id,
              email: parsedUser.email,
              role: parsedUser.role
            })
            setUser(parsedUser)
            setIsAuthenticated(true)
            console.log('✅ [AuthContext] Restored authentication state, isAuthenticated = true')
          } catch (error) {
            console.error('❌ [AuthContext] Error parsing user info:', error)
            // Clear invalid data
            localStorage.removeItem('kaam247_token')
            localStorage.removeItem('kaam247_user')
          }
        } else {
          console.log('ℹ️ [AuthContext] No existing token found, user not authenticated')
        }
      }
      
      setLoading(false)
      console.log('🏁 [AuthContext] Initialization complete, loading = false')
    }

    initializeAuth()
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

  // Google Sign-In Authentication (using redirect instead of popup to avoid COOP issues)
  const loginWithGoogle = async () => {
    try {
      console.log('🔵 [AuthContext] loginWithGoogle called')
      console.log('🔍 [AuthContext] Firebase check:', {
        hasAuth: !!auth,
        hasGoogleProvider: !!googleProvider,
        authDomain: auth?.config?.authDomain,
        currentUrl: window.location.href
      })
      
      if (!auth || !googleProvider) {
        console.error('❌ [AuthContext] Firebase not configured')
        throw new Error('Firebase is not configured. Please contact support.')
      }

      // Store current URL to redirect back after Google sign-in
      const currentPath = window.location.pathname + window.location.search
      sessionStorage.setItem('googleSignInRedirect', currentPath)
      console.log('💾 [AuthContext] Stored redirect path:', currentPath)

      // Sign in with Google redirect (works better with COOP policies)
      console.log('🔄 [AuthContext] Initiating signInWithRedirect...')
      console.log('🔍 [AuthContext] Redirect will go to:', window.location.origin)
      
      await signInWithRedirect(auth, googleProvider)
      
      // This function will return immediately - the actual auth happens after redirect
      // The redirect result will be handled in the useEffect hook above
      console.log('✅ [AuthContext] signInWithRedirect initiated, redirecting to Google...')
      return {
        success: true,
        redirecting: true
      }
    } catch (error) {
      console.error('❌ [AuthContext] Error initiating Google sign-in:', error)
      console.error('❌ [AuthContext] Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      })
      return {
        success: false,
        error: error.message || 'Failed to sign in with Google. Please try again.'
      }
    }
  }

  // Complete profile setup for new users
  const completeProfileSetup = async (name, email) => {
    try {
      const token = localStorage.getItem('kaam247_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/profile/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          email
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Profile setup failed')
      }

      const data = await response.json()

      // Update stored user info
      localStorage.setItem('kaam247_token', data.token)
      localStorage.setItem('kaam247_user', JSON.stringify({
        id: data.user._id || data.user.id,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        role: data.user.role || data.user.roleMode,
        profileSetupCompleted: data.user.profileSetupCompleted
      }))

      setUser({
        id: data.user._id || data.user.id,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        role: data.user.role || data.user.roleMode,
        profileSetupCompleted: data.user.profileSetupCompleted
      })

      return { success: true }
    } catch (error) {
      console.error('Error completing profile setup:', error)
      return {
        success: false,
        error: error.message || 'Failed to complete profile setup'
      }
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
      logout,
      loginWithGoogle,
      completeProfileSetup
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

