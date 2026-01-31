const express = require('express')
const router = express.Router()
const { register, login, logout, googleLogin, completeProfileSetup } = require('../controllers/authController')
const { authenticate } = require('../middleware/auth')

// POST /api/auth/register - Register new user (email/password)
router.post('/auth/register', register)

// POST /api/auth/login - Login user (email/password)
router.post('/auth/login', login)

// POST /api/auth/logout - Logout user (clear cookie)
router.post('/auth/logout', logout)

// POST /api/auth/google - Google Sign-In (body: { idToken })
router.post('/auth/google', googleLogin)

// PATCH /api/auth/profile-setup - Complete profile after Google sign-in (name, phone)
router.patch('/auth/profile-setup', authenticate, completeProfileSetup)

module.exports = router

