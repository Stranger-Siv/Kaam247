const express = require('express')
const router = express.Router()

// Simple in-memory cache + rate limiting (per-process)
// NOTE: This is for local/dev + small deployments. For scale, move to Redis.
const cache = new Map() // key -> { value, expiresAt }
const ipLastHit = new Map() // ip -> ts

function getClientIp(req) {
  const xf = req.headers['x-forwarded-for']
  if (typeof xf === 'string' && xf.length > 0) return xf.split(',')[0].trim()
  return req.ip || req.connection?.remoteAddress || 'unknown'
}

function roundCoord(n, decimals = 5) {
  const f = Math.pow(10, decimals)
  return Math.round(Number(n) * f) / f
}

// GET /api/geocode/reverse?lat=..&lng=..
router.get('/geocode/reverse', async (req, res) => {
  try {
    const lat = Number(req.query.lat)
    const lng = Number(req.query.lng)

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ error: 'Invalid coordinates' })
    }

    const latR = roundCoord(lat, 5)
    const lngR = roundCoord(lng, 5)
    const cacheKey = `${latR},${lngR}`

    const now = Date.now()
    const cached = cache.get(cacheKey)
    if (cached && cached.expiresAt > now) {
      return res.json(cached.value)
    }

    // Soft rate limit: at most 1 request / second per IP
    const ip = getClientIp(req)
    const last = ipLastHit.get(ip) || 0
    if (now - last < 1000) {
      return res.status(429).json({ error: 'Too many requests. Please retry.' })
    }
    ipLastHit.set(ip, now)

    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('format', 'json')
    url.searchParams.set('lat', String(latR))
    url.searchParams.set('lon', String(lngR))
    url.searchParams.set('zoom', '18')
    url.searchParams.set('addressdetails', '1')

    // Nominatim requires a valid User-Agent identifying the application.
    const resp = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Kaam247/1.0 (support@kaam247.in)',
        'Accept': 'application/json',
        'Accept-Language': 'en'
      }
    })

    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      return res.status(resp.status).json({
        error: 'Reverse geocoding failed',
        status: resp.status,
        detail: text?.slice(0, 200) || undefined
      })
    }

    const data = await resp.json()
    const address = data.address || {}
    const area = address.suburb || address.neighbourhood || address.road || address.locality || null
    const city = address.city || address.town || address.county || address.state || null

    const payload = { area, city, lat: latR, lng: lngR }
    cache.set(cacheKey, { value: payload, expiresAt: now + 1000 * 60 * 60 }) // 1h

    return res.json(payload)
  } catch (e) {
    return res.status(500).json({ error: 'Server error', message: e.message })
  }
})

module.exports = router


