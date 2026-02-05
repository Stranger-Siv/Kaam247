/**
 * Single MongoDB connection module for the application.
 * Ensures one connection is created and reused; safe for MongoDB Atlas Flex.
 */

const mongoose = require('mongoose')

const isProduction = process.env.NODE_ENV === 'production'

// Disable autoIndex in production (build indexes in CI or via scripts)
mongoose.set('autoIndex', !isProduction)

// Connection options for Atlas Flex and low-memory environments (e.g. Render 512 MB)
const CONNECT_OPTIONS = {
  serverSelectionTimeoutMS: 10000,
  maxPoolSize: 10,
  minPoolSize: 1,
  retryWrites: true,
  monitorCommands: true // Required for slow-query logging (no payloads logged)
}

const SLOW_QUERY_MS = 200
const SLOW_QUERY_MAP_MAX = 5000
const slowQueryByRequestId = new Map()

let connectionPromise = null

/**
 * Connect to MongoDB. Idempotent: repeated calls return the same promise.
 * Call this once at startup; do not call per request.
 * @returns {Promise<void>} Resolves when connected; rejects on failure.
 */
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return
  }
  if (connectionPromise) {
    return connectionPromise
  }

  const uri = process.env.MONGO_URI
  if (!uri || typeof uri !== 'string' || !uri.trim()) {
    const err = new Error('MONGO_URI is not set or empty')
    console.error('[db]', err.message)
    throw err
  }

  connectionPromise = (async () => {
    try {
      await mongoose.connect(uri.trim(), CONNECT_OPTIONS)
      if (mongoose.connection.readyState === 1) {
        console.log('[db] MongoDB connected successfully')
        registerSlowQueryLogging()
      }
    } catch (error) {
      console.error('[db] MongoDB connection error:', error.message)
      connectionPromise = null
      throw error
    }
  })()

  return connectionPromise
}

/**
 * Disconnect from MongoDB (for graceful shutdown / tests).
 * @returns {Promise<void>}
 */
const disconnectDB = async () => {
  if (mongoose.connection.readyState === 0) return
  try {
    await mongoose.disconnect()
    connectionPromise = null
    console.log('[db] MongoDB disconnected')
  } catch (error) {
    console.error('[db] MongoDB disconnect error:', error.message)
    connectionPromise = null
    throw error
  }
}

/**
 * Log slow MongoDB commands (>SLOW_QUERY_MS). Only collection name and operation type;
 * no query payloads to avoid sensitive data.
 */
function registerSlowQueryLogging() {
  try {
    const client = mongoose.connection.getClient()
    if (!client || typeof client.on !== 'function') return

    client.on('commandStarted', (ev) => {
      if (slowQueryByRequestId.size >= SLOW_QUERY_MAP_MAX) return
      const cmd = ev.command || {}
      const coll = cmd.find ?? cmd.aggregate ?? cmd.insert ?? cmd.update ?? cmd.delete ?? cmd.count
      const name = typeof coll === 'string' ? coll : (coll != null ? '(coll)' : 'n/a')
      slowQueryByRequestId.set(ev.requestId, name)
    })

    client.on('commandSucceeded', (ev) => {
      if (ev.duration <= SLOW_QUERY_MS) return
      const coll = slowQueryByRequestId.get(ev.requestId) ?? 'n/a'
      slowQueryByRequestId.delete(ev.requestId)
      setImmediate(() => {
        console.warn('[slow-query]', ev.commandName, coll, `${ev.duration}ms`)
      })
    })

    client.on('commandFailed', (ev) => {
      slowQueryByRequestId.delete(ev.requestId)
    })
  } catch (e) {
    console.error('[db] slow-query logging setup failed:', e.message)
  }
}

// Optional: log connection events in development (no per-request logging)
if (!isProduction) {
  mongoose.connection.on('error', (err) => {
    console.error('[db] connection error:', err.message)
  })
  mongoose.connection.on('disconnected', () => {
    console.warn('[db] disconnected')
  })
}

module.exports = connectDB
module.exports.connectDB = connectDB
module.exports.disconnectDB = disconnectDB
