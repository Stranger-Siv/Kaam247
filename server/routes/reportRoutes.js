const express = require('express')
const router = express.Router()
const { createReport } = require('../controllers/reportController')
const { authenticate } = require('../middleware/auth')

// POST /api/reports - Create a new report (authenticated users only)
router.post('/reports', authenticate, createReport)

module.exports = router

