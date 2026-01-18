const { authenticate } = require('./auth')

// Admin middleware - must be used AFTER authenticate middleware
const adminMiddleware = async (req, res, next) => {
  try {
    // Ensure user is authenticated first
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      })
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      })
    }

    // Check if admin is active
    if (req.user.status !== 'active') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin account is not active'
      })
    }

    next()
  } catch (error) {
    return res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred during admin verification'
    })
  }
}

module.exports = { adminMiddleware }

