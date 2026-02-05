/**
 * Global error handling: standardize error responses and prevent process crashes.
 * Use as final middleware (4-arg form). Register uncaughtException/unhandledRejection in index.
 */

function globalErrorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500
  const code = status
  const message = err.message || 'An error occurred'
  const isProd = process.env.NODE_ENV === 'production'

  if (status >= 500) {
    setImmediate(() => {
      console.error('[error]', req.method, req.path || req.url, status, message)
      if (!isProd && err.stack) console.error(err.stack)
    })
  }

  res.status(status).json({
    error: err.name || 'Error',
    message: isProd && status >= 500 ? 'Internal server error' : message,
    ...(isProd ? {} : { statusCode: code })
  })
}

module.exports = globalErrorHandler
