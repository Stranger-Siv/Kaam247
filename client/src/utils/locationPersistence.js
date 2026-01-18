import { API_BASE_URL } from '../config/env'

/**
 * Persists user location to backend user profile
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} area - Area name (optional)
 * @param {string} city - City name (optional)
 * @returns {Promise<boolean>} - Returns true if successful, false otherwise
 */
export async function persistUserLocation(lat, lng, area = null, city = null) {
  try {
    const token = localStorage.getItem('kaam247_token')
    if (!token) {
      return false
    }

    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        location: {
          lat,
          lng,
          area: area || undefined,
          city: city || undefined
        }
      })
    })

    if (response.ok) {
      // Trigger location_updated event for other components
      window.dispatchEvent(new CustomEvent('location_updated', {
        detail: { lat, lng, area, city }
      }))
      
      // Trigger profile_updated event for Profile page
      window.dispatchEvent(new CustomEvent('profile_location_updated'))
      
      return true
    }
    
    return false
  } catch (error) {
    // Silently fail - location persistence is non-critical
    return false
  }
}

