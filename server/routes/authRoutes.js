const express = require('express')
const router = express.Router()
const { register, login, logout, verifyGoogleAuth, completeProfileSetup } = require('../controllers/authController')
const { authenticate } = require('../middleware/auth')

// POST /api/auth/register - Register new user (email/password)
router.post('/auth/register', register)

// POST /api/auth/login - Login user (email/password)
router.post('/auth/login', login)

// POST /api/auth/logout - Logout user (clear cookie)
router.post('/auth/logout', logout)

// POST /api/auth/google/verify - Verify Google OAuth and authenticate
router.post('/auth/google/verify', verifyGoogleAuth)

// POST /api/auth/profile/setup - Complete profile setup after Google auth
router.post('/auth/profile/setup', authenticate, completeProfileSetup)

module.exports = router

