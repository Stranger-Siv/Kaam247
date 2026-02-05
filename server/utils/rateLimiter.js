/**
 * In-memory sliding-window rate limiter. No Redis.
 * Memory-safe: expires old keys via periodic cleanup.
 */

const CLEANUP_INTERVAL_MS = 2 * 60 * 1000  // 2 min
const KEY_TTL_MS = 2 * 60 * 1000          // consider key stale after 2 min without activity
const MAX_TIMESTAMPS_PER_KEY = 100         // cap per key to avoid unbounded arrays

const store = new Map()  // key -> { timestamps: number[] }
let cleanupTimer = null

function getClientIp(req) {
  const xf = req.headers['x-forwarded-for']
  if (typeof xf === 'string' && xf.length > 0) return xf.split(',')[0].trim()
  return req.ip || req.connection?.remoteAddress || 'unknown'
}

function cleanup() {
  const now = Date.now()
  const cutoff = now - KEY_TTL_MS
  for (const [key, entry] of store.entries()) {
    const last = entry.timestamps[entry.timestamps.length - 1]
    if (last == null || last < cutoff) store.delete(key)
  }
}

function startCleanupTimer() {
  if (cleanupTimer) return
  cleanupTimer = setInterval(cleanup, CLEANUP_INTERVAL_MS)
  if (cleanupTimer.unref) cleanupTimer.unref()
}

/**
 * Sliding window: drop timestamps outside [now - windowMs, now].
 * @param {string} key - Unique key (e.g. ip:auth:login)
 * @param {number} windowMs - Window size in ms
 * @param {number} max - Max requests allowed in window
 * @returns {{ allowed: boolean, remaining: number, resetAt: number, retryAfterSec: number }}
 */
function check(key, windowMs, max) {
  startCleanupTimer()
  const now = Date.now()
  const cutoff = now - windowMs
  let entry = store.get(key)
  if (!entry) entry = { timestamps: [] }
  entry.timestamps = entry.timestamps.filter(t => t > cutoff)
  if (entry.timestamps.length >= max) {
    const resetAt = entry.timestamps[0] + windowMs
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfterSec: Math.max(1, Math.ceil((resetAt - now) / 1000))
    }
  }
  entry.timestamps.push(now)
  if (entry.timestamps.length > MAX_TIMESTAMPS_PER_KEY) {
    entry.timestamps = entry.timestamps.slice(-MAX_TIMESTAMPS_PER_KEY)
  }
  store.set(key, entry)
  const resetAt = entry.timestamps[0] + windowMs
  return {
    allowed: true,
    remaining: max - entry.timestamps.length,
    resetAt,
    retryAfterSec: 0
  }
}

/**
 * @param {object} options
 * @param {string} options.name - Route name (used in key to isolate limits)
 * @param {number} options.windowMs - Window in ms (e.g. 60000)
 * @param {number} options.max - Max requests per window
 * @param {'ip'|'user'|'userOrIp'} options.keyBy - 'ip' | 'user' (req.user required) | 'userOrIp' (user if authenticated else ip)
 */
function createRateLimiter(options) {
  const { name, windowMs = 60000, max = 10, keyBy = 'ip' } = options

  return (req, res, next) => {
    let identifier
    if (keyBy === 'ip') {
      identifier = getClientIp(req)
    } else if (keyBy === 'user') {
      if (!req.user || !req.user._id) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required for this rate limit'
        })
      }
      identifier = String(req.user._id)
    } else {
      // userOrIp
      identifier = (req.user && req.user._id) ? String(req.user._id) : getClientIp(req)
    }
    const key = `rl:${keyBy === 'ip' ? 'ip' : keyBy === 'user' ? 'u' : 'uo'}:${identifier}:${name}`

    const result = check(key, windowMs, max)

    res.setHeader('X-RateLimit-Limit', String(max))
    res.setHeader('X-RateLimit-Remaining', String(result.remaining))
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)))

    if (!result.allowed) {
      res.setHeader('Retry-After', String(result.retryAfterSec))
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: result.retryAfterSec
      })
    }
    next()
  }
}

module.exports = {
  createRateLimiter,
  getClientIp
}
