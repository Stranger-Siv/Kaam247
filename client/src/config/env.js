// Environment configuration
// All environment variables must be prefixed with VITE_ to be accessible in the browser

// Detect if we're in production (Netlify, Vercel, etc.)
// Check both build-time and runtime to be sure
const isProduction = import.meta.env.PROD ||
  (typeof window !== 'undefined' &&
    !window.location.hostname.includes('localhost') &&
    !window.location.hostname.includes('127.0.0.1'))

// Get API base URL - use environment variable or default to backend
// In production, NEVER use localhost
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL

  // If environment variable is explicitly set, use it
  if (envUrl && envUrl.trim() !== '') {
    // But reject localhost in production
    if (isProduction && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
      console.error('⚠️ ERROR: VITE_API_BASE_URL is set to localhost in production!')
      console.error('This will cause CORS errors. Please set it to your backend URL in Netlify.')
      // Fall back to production default
      return 'https://kaam247.onrender.com'
    }
    return envUrl.trim()
  }

  // No environment variable set - use defaults based on environment
  if (isProduction) {
    // Production default - your backend URL
    return 'https://kaam247.onrender.com'
  }

  // Development default
  return 'http://localhost:3001'
}

// Get Socket URL - use environment variable or default to backend
const getSocketUrl = () => {
  const envUrl = import.meta.env.VITE_SOCKET_URL

  // If environment variable is explicitly set, use it
  if (envUrl && envUrl.trim() !== '') {
    // But reject localhost in production
    if (isProduction && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
      console.error('⚠️ ERROR: VITE_SOCKET_URL is set to localhost in production!')
      console.error('This will cause CORS errors. Please set it to your backend URL in Netlify.')
      // Fall back to production default
      return 'https://kaam247.onrender.com'
    }
    return envUrl.trim()
  }

  // No environment variable set - use defaults based on environment
  if (isProduction) {
    // Production default - your backend URL
    return 'https://kaam247.onrender.com'
  }

  // Development default
  return 'http://localhost:3001'
}

export const API_BASE_URL = getApiBaseUrl()
export const SOCKET_URL = getSocketUrl()

// Socket.IO is currently DISABLED - app works fully with REST APIs only
// TODO: Enable Socket.IO when backend supports it
// TODO: Consider using Push Notifications API for PWA instead of Socket.IO
export const SOCKET_ENABLED = false // Set to true when backend socket is ready

// Log the final URLs for debugging (only in production)
if (isProduction) {
  console.log('🌐 API Configuration:')
  console.log('  API_BASE_URL:', API_BASE_URL)
  console.log('  SOCKET_URL:', SOCKET_URL)
  console.log('  Environment:', import.meta.env.MODE)
  console.log('  VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL || 'NOT SET')
  console.log('  VITE_SOCKET_URL:', import.meta.env.VITE_SOCKET_URL || 'NOT SET')

  // Warn if still using localhost (shouldn't happen with our checks, but just in case)
  if (API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1')) {
    console.error('❌ CRITICAL ERROR: API_BASE_URL is still pointing to localhost!')
    console.error('This will cause CORS errors. Please set VITE_API_BASE_URL in Netlify environment variables.')
  }

  // Info about current backend URL
  if (API_BASE_URL.includes('kaam247.onrender.com')) {
    console.info('ℹ️ Using Render backend: https://kaam247.onrender.com')
    console.info('💡 Tip: Later you can set up api.kaam247.in DNS and update environment variables')
  }
}

