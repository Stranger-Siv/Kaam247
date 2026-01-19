import { apiGet } from './api'

/**
 * Reverse geocode via Kaam247 backend to avoid browser CORS + Nominatim 403.
 * Includes a tiny in-memory cache so we don't spam the API when coords barely change.
 * @returns {Promise<{area: string|null, city: string|null}>}
 */
let lastLat = null
let lastLng = null
let lastResult = null

export async function reverseGeocode(lat, lng) {
  const roundedLat = Math.round(Number(lat) * 1e5) / 1e5
  const roundedLng = Math.round(Number(lng) * 1e5) / 1e5

  if (lastResult && lastLat === roundedLat && lastLng === roundedLng) {
    return lastResult
  }

  const { data, error } = await apiGet(`/api/geocode/reverse?lat=${encodeURIComponent(roundedLat)}&lng=${encodeURIComponent(roundedLng)}`)
  if (error) {
    throw new Error(error)
  }

  lastLat = roundedLat
  lastLng = roundedLng
  lastResult = { area: data?.area ?? null, city: data?.city ?? null }

  return lastResult
}


