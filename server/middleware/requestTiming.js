/**
 * Request-level performance logging.
 * Logs any API request that takes longer than SLOW_MS (non-blocking).
 */

const SLOW_MS = 500

function requestTiming(req, res, next) {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    if (duration <= SLOW_MS) return
    // Defer logging so response is not blocked
    setImmediate(() => {
      console.warn(
        '[slow]',
        req.method,
        req.path || req.url,
        res.statusCode,
        `${duration}ms`
      )
    })
  })
  next()
}

module.exports = requestTiming
