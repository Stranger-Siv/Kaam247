/**
 * Run non-critical work after the response is sent. Use for:
 * - Socket/push notifications
 * - Cache invalidation
 * - Admin logs / analytics
 * Never blocks the main response path; errors are caught and logged.
 */

const PREFIX = '[background]'

function logError(label, err) {
  const message = err && (err.message || String(err))
  console.error(`${PREFIX} ${label}:`, message)
  if (err && err.stack && process.env.NODE_ENV !== 'production') {
    console.error(err.stack)
  }
}

/**
 * Schedule work to run after the current request/response cycle (next tick).
 * Use for notifications, cache invalidation, logging, etc. that must not block or fail the API response.
 * - fn can be sync or async; if it returns a Promise, rejections are caught and logged.
 * - Does not throw; never causes unhandled rejection.
 * @param {string} label - Short label for error logs (e.g. 'broadcastNewTask')
 * @param {() => void | Promise<void>} fn - Work to run (must not throw synchronously; async errors are caught)
 */
function runAfterResponse(label, fn) {
  setImmediate(() => {
    try {
      const result = fn()
      if (result && typeof result.then === 'function') {
        result.catch((err) => logError(label, err))
      }
    } catch (err) {
      logError(label, err)
    }
  })
}

module.exports = {
  runAfterResponse,
  logError
}
