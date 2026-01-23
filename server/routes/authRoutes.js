const express = require('express')
const router = express.Router()
const { register, login, logout } = require('../controllers/authController')

// POST /api/auth/register - Register new user (email/password)
router.post('/auth/register', register)

// POST /api/auth/login - Login user (email/password)
router.post('/auth/login', login)

// POST /api/auth/logout - Logout user (clear cookie)
router.post('/auth/logout', logout)

module.exports = router

