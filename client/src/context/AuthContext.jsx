import { createContext, useContext, useState, useEffect } from 'react'
import { API_BASE_URL } from '../config/env'
import { persistUserLocation } from '../utils/locationPersistence'
import { reverseGeocode } from '../utils/geocoding'
import { auth, initializeRecaptcha, googleProvider } from '../config/firebase'
import { signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential, signInWithRedirect, getRedirectResult } from 'firebase/auth'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check localStorage on mount for existing token
  useEffect(() => {
    const initializeAuth = async () => {
      // Check for Google redirect result
      if (auth && googleProvider) {
        try {
          const result = await getRedirectResult(auth)
          if (result) {
            // User just returned from Google sign-in redirect
            const userCredential = result.user
            const idToken = await userCredential.getIdToken()

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

              // Capture location if available
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

                try {
                  const { area, city } = await reverseGeocode(lat, lng)
                  await persistUserLocation(lat, lng, area, city)
                } catch {
                  await persistUserLocation(lat, lng, null, null)
                }
                
                localStorage.setItem('kaam247_workerLocation', JSON.stringify(location))
                window.dispatchEvent(new CustomEvent('location_updated', { detail: location }))
              } catch (locationError) {
                // Location capture failed - non-fatal
              }

              // Trigger navigation event - components will handle navigation
              // The Login/Register component's useEffect will detect isAuthenticated and navigate
              window.dispatchEvent(new CustomEvent('googleSignInSuccess', { 
                detail: { 
                  requiresProfileSetup: data.requiresProfileSetup,
                  user: data.user 
                } 
              }))
            }
          }
        } catch (error) {
          console.error('Error handling redirect result:', error)
        }
      }

      // Check for existing token
      const token = localStorage.getItem('kaam247_token')
      const userInfo = localStorage.getItem('kaam247_user')

      if (token && userInfo) {
        try {
          const parsedUser = JSON.parse(userInfo)
          setUser(parsedUser)
          setIsAuthenticated(true)
        } catch (error) {
          // Clear invalid data
          localStorage.removeItem('kaam247_token')
          localStorage.removeItem('kaam247_user')
        }
      }
      setLoading(false)
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

  // Firebase Phone Authentication
  const loginWithPhone = async (phoneNumber) => {
    try {
      if (!auth) {
        throw new Error('Firebase is not configured. Please contact support.')
      }

      // Format phone number (ensure it starts with +)
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`

      // Initialize reCAPTCHA
      const recaptchaVerifier = initializeRecaptcha('recaptcha-container')

      // Send OTP
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier)

      // Store confirmation result for OTP verification
      return {
        success: true,
        confirmationResult,
        phoneNumber: formattedPhone
      }
    } catch (error) {
      console.error('Error sending OTP:', error)
      return {
        success: false,
        error: error.message || 'Failed to send OTP. Please try again.'
      }
    }
  }

  // Verify OTP and complete authentication
  const verifyPhoneOTP = async (confirmationResult, otp, phoneNumber) => {
    try {
      if (!auth) {
        throw new Error('Firebase is not configured.')
      }

      // Verify OTP
      const result = await confirmationResult.confirm(otp)
      const userCredential = result.user
      const idToken = await userCredential.getIdToken()

      // Send ID token to backend for verification and user creation/login
      const response = await fetch(`${API_BASE_URL}/api/auth/phone/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          idToken,
          phoneNumber: userCredential.phoneNumber
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Authentication failed')
      }

      const data = await response.json()

      // Store token and user info
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
      setIsAuthenticated(true)

      // Capture location if available
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

        try {
          const { area, city } = await reverseGeocode(lat, lng)
          await persistUserLocation(lat, lng, area, city)
        } catch {
          await persistUserLocation(lat, lng, null, null)
        }
        
        localStorage.setItem('kaam247_workerLocation', JSON.stringify(location))
        window.dispatchEvent(new CustomEvent('location_updated', { detail: location }))
      } catch (locationError) {
        // Location capture failed - non-fatal
      }

      return {
        success: true,
        requiresProfileSetup: data.requiresProfileSetup || false,
        user: data.user
      }
    } catch (error) {
      console.error('Error verifying OTP:', error)
      return {
        success: false,
        error: error.message || 'Failed to verify OTP. Please try again.'
      }
    }
  }

  // Google Sign-In Authentication (using redirect instead of popup to avoid COOP issues)
  const loginWithGoogle = async () => {
    try {
      if (!auth || !googleProvider) {
        throw new Error('Firebase is not configured. Please contact support.')
      }

      // Store current URL to redirect back after Google sign-in
      const currentPath = window.location.pathname + window.location.search
      sessionStorage.setItem('googleSignInRedirect', currentPath)

      // Sign in with Google redirect (works better with COOP policies)
      await signInWithRedirect(auth, googleProvider)
      
      // This function will return immediately - the actual auth happens after redirect
      // The redirect result will be handled in the useEffect hook above
      return {
        success: true,
        redirecting: true
      }
    } catch (error) {
      console.error('Error initiating Google sign-in:', error)
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
    // Clear Firebase reCAPTCHA if exists
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear()
      window.recaptchaVerifier = null
    }
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      loading,
      login,
      register,
      logout,
      loginWithPhone,
      verifyPhoneOTP,
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

