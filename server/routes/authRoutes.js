const express = require('express')
const router = express.Router()
const { register, login, logout, googleLogin, completeProfileSetup } = require('../controllers/authController')
const { authenticate } = require('../middleware/auth')
const { createRateLimiter } = require('../utils/rateLimiter')

// Auth: 8 req/min per IP (no user yet)
const authLimit = createRateLimiter({ name: 'auth', windowMs: 60000, max: 8, keyBy: 'ip' })

// POST /api/auth/register - Register new user (email/password)
router.post('/auth/register', authLimit, register)

// POST /api/auth/login - Login user (email/password)
router.post('/auth/login', authLimit, login)

// POST /api/auth/logout - Logout user (clear cookie)
router.post('/auth/logout', logout)

// POST /api/auth/google - Google Sign-In (body: { idToken })
router.post('/auth/google', authLimit, googleLogin)

// PATCH /api/auth/profile-setup - Complete profile after Google sign-in (name, phone)
router.patch('/auth/profile-setup', authenticate, completeProfileSetup)

module.exports = router

