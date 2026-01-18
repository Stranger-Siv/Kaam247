// Environment configuration
// All environment variables must be prefixed with VITE_ to be accessible in the browser

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

// Configuration loaded silently

