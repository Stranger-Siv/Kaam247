import { apiGet } from './api'

/**
 * Reverse geocode via Kaam247 backend to avoid browser CORS + Nominatim 403.
 * @returns {Promise<{area: string|null, city: string|null}>}
 */
export async function reverseGeocode(lat, lng) {
  const { data, error } = await apiGet(`/api/geocode/reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`)
  if (error) {
    throw new Error(error)
  }
  return { area: data?.area ?? null, city: data?.city ?? null }
}


