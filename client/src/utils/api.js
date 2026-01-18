// Centralized API utility with error handling
import { API_BASE_URL } from '../config/env'

/**
 * Safe fetch wrapper that handles errors gracefully
 * @param {string} endpoint - API endpoint (e.g., '/api/users/me')
 * @param {object} options - Fetch options (headers, method, body, etc.)
 * @returns {Promise<{data: any, error: string|null}>}
 */
export async function safeFetch(endpoint, options = {}) {
  try {
    const token = localStorage.getItem('kaam247_token')
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: defaultHeaders
    })

    // Handle network errors
    if (!response.ok) {
      // Handle 401 Unauthorized
      if (response.status === 401) {
        // Clear auth and redirect to login
        localStorage.removeItem('kaam247_token')
        localStorage.removeItem('kaam247_user')
        window.location.href = '/login'
        return { data: null, error: 'Session expired. Please login again.' }
      }

      // Handle other HTTP errors
      const errorText = await response.text()
      let errorMessage = 'Request failed'
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.message || errorJson.error || errorMessage
      } catch {
        errorMessage = errorText || `HTTP ${response.status}`
      }

      return { data: null, error: errorMessage }
    }

    // Parse response
    const data = await response.json()
    return { data, error: null }
  } catch (error) {
    // Handle network failures, timeouts, etc.
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return { 
        data: null, 
        error: 'Network error. Please check your connection and try again.' 
      }
    }
    
    return { 
      data: null, 
      error: error.message || 'An unexpected error occurred' 
    }
  }
}

/**
 * GET request helper
 */
export async function apiGet(endpoint, options = {}) {
  return safeFetch(endpoint, { ...options, method: 'GET' })
}

/**
 * POST request helper
 */
export async function apiPost(endpoint, body, options = {}) {
  return safeFetch(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body)
  })
}

/**
 * PUT request helper
 */
export async function apiPut(endpoint, body, options = {}) {
  return safeFetch(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body)
  })
}

/**
 * DELETE request helper
 */
export async function apiDelete(endpoint, options = {}) {
  return safeFetch(endpoint, { ...options, method: 'DELETE' })
}

