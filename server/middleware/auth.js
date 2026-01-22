const jwt = require('jsonwebtoken')
const User = require('../models/User')

// Middleware to verify JWT token
const authenticate = async (req, res, next) => {
  try {
    // Get token from cookie first, then fall back to Authorization header
    let token = req.cookies?.token || null
    
    // If no cookie, check Authorization header (for backward compatibility)
    if (!token) {
      const authHeader = req.headers.authorization
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7) // Remove 'Bearer ' prefix
      }
    }
    
    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided. Please login first.'
      })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kaam247_secret_key_change_in_production')
    
    // Find user
    const user = await User.findById(decoded.userId)
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found'
      })
    }

    // Attach user to request
    req.user = user
    req.userId = decoded.userId
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token is invalid or expired'
      })
    }
    return res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred during authentication'
    })
  }
}

module.exports = { authenticate }

