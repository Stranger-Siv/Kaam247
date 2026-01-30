const jwt = require('jsonwebtoken')
const User = require('../models/User')

const JWT_SECRET = process.env.JWT_SECRET
const isProduction = process.env.NODE_ENV === 'production'

if (isProduction && (!JWT_SECRET || JWT_SECRET.length < 32)) {
  throw new Error('JWT_SECRET must be set and at least 32 characters in production')
}

const getSecret = () => JWT_SECRET || (isProduction ? null : 'dev-secret-change-in-production')

// Middleware to verify JWT token
const authenticate = async (req, res, next) => {
  try {
    let token = req.cookies?.token || null
    if (!token) {
      const authHeader = req.headers.authorization
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided. Please login first.'
      })
    }

    const secret = getSecret()
    if (!secret) throw new Error('JWT_SECRET is required')

    const decoded = jwt.verify(token, secret)
    const user = await User.findById(decoded.userId)

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found'
      })
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: 'Account disabled',
        message: 'Your account has been disabled. Please contact support.'
      })
    }

    req.user = user
    req.userId = decoded.userId
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please login again.'
      })
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token is invalid. Please login again.'
      })
    }
    return res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred during authentication'
    })
  }
}

module.exports = { authenticate }

