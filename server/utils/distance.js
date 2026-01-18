/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return Math.round(distance * 10) / 10 // Round to 1 decimal place
}

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number} Radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180)
}

/**
 * Check if a task is within the specified radius
 * @param {number} taskLat - Task latitude
 * @param {number} taskLon - Task longitude
 * @param {number} workerLat - Worker latitude
 * @param {number} workerLon - Worker longitude
 * @param {number} radiusKm - Radius in kilometers (default: 5)
 * @returns {boolean} True if task is within radius
 */
function isWithinRadius(taskLat, taskLon, workerLat, workerLon, radiusKm = 5) {
  const distance = calculateDistance(taskLat, taskLon, workerLat, workerLon)
  return distance <= radiusKm
}

module.exports = {
  calculateDistance,
  isWithinRadius
}

