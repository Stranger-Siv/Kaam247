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
  retryWrites: true
}

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
