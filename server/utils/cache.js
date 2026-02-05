/**
 * Lightweight in-memory TTL cache for read-heavy endpoints.
 * No Redis; memory-safe with bounded size and automatic expiry cleanup.
 */

const CACHE_CLEANUP_INTERVAL_MS = 60 * 1000
const DEFAULT_MAX_KEYS = 500

const store = new Map()
let maxKeys = Number(process.env.CACHE_MAX_KEYS) || DEFAULT_MAX_KEYS
let cleanupTimer = null

function cleanup() {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt <= now) store.delete(key)
  }
  if (store.size > maxKeys) {
    const byExpiry = [...store.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt)
    const toRemove = store.size - maxKeys
    for (let i = 0; i < toRemove && i < byExpiry.length; i++) {
      store.delete(byExpiry[i][0])
    }
  }
}

function startCleanupTimer() {
  if (cleanupTimer) return
  cleanupTimer = setInterval(cleanup, CACHE_CLEANUP_INTERVAL_MS)
  if (cleanupTimer.unref) cleanupTimer.unref()
}

/**
 * @param {string} key
 * @returns {any|undefined} Cached value or undefined if missing/expired
 */
function get(key) {
  const entry = store.get(key)
  if (!entry) return undefined
  if (entry.expiresAt <= Date.now()) {
    store.delete(key)
    return undefined
  }
  return entry.value
}

/**
 * @param {string} key
 * @param {any} value - Must be JSON-serializable if you log/send as JSON
 * @param {number} ttlMs - TTL in milliseconds
 */
function set(key, value, ttlMs) {
  startCleanupTimer()
  if (store.size >= maxKeys && !store.has(key)) cleanup()
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  })
}

/**
 * @param {string} key
 */
function del(key) {
  store.delete(key)
}

/**
 * Remove all keys that start with prefix.
 * @param {string} prefix
 */
function delPrefix(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key)
  }
}

/**
 * Wrap a handler so its JSON response is cached. Handler must call res.json(body).
 * @param {(req: object) => string} keyFn - Returns cache key from req
 * @param {number} ttlMs - TTL in milliseconds
 * @param {(req: object, res: object) => void} handler - Express route handler
 * @returns {Function} Express middleware/handler
 */
function withCache(keyFn, ttlMs, handler) {
  return (req, res) => {
    const key = keyFn(req)
    const cached = get(key)
    if (cached !== undefined) {
      if (process.env.NODE_ENV !== 'test') {
        console.log('[cache hit]', key)
      }
      return res.json(cached)
    }
    const originalJson = res.json.bind(res)
    res.json = (body) => {
      const status = res.statusCode || 200
      if (status >= 200 && status < 300) set(key, body, ttlMs)
      originalJson(body)
    }
    return handler(req, res)
  }
}

// ---------- Invalidation (call from controllers on write) ----------

function invalidateCategories() {
  del('categories')
}

function invalidatePlatformConfig() {
  del('platform-config')
}

function invalidatePublicStats() {
  del('stats')
}

function invalidateAdminSettings() {
  del('admin:settings')
}

function invalidateAdminDashboards() {
  delPrefix('admin:stats')
  delPrefix('admin:dashboard')
  delPrefix('admin:pilot-dashboard')
  del('admin:analytics')
}

function invalidatePilotDashboard() {
  delPrefix('admin:pilot-dashboard')
}

/** Call when task status or count changes (create, accept, complete, cancel, etc.) */
function invalidateStatsAndAdminDashboards() {
  invalidatePublicStats()
  invalidateAdminDashboards()
}

/** Call when admin updates settings (config). Optionally pass the config key that changed. */
function invalidateSettingsKeys(updatedKey) {
  invalidateAdminSettings()
  if (updatedKey === 'taskCategories') invalidateCategories()
  if (updatedKey === 'platformCommissionPercent') invalidatePlatformConfig()
}

module.exports = {
  get,
  set,
  del,
  delPrefix,
  withCache,
  invalidateCategories,
  invalidatePlatformConfig,
  invalidatePublicStats,
  invalidateAdminSettings,
  invalidateAdminDashboards,
  invalidatePilotDashboard,
  invalidateStatsAndAdminDashboards,
  invalidateSettingsKeys
}
