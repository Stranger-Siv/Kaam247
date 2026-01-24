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

// Socket.IO is ENABLED - real-time features are active
// App uses Socket.IO for real-time updates and falls back to REST APIs if socket fails
export const SOCKET_ENABLED = true


