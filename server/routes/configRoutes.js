const express = require('express')
const router = express.Router()
const Config = require('../models/Config')
const { withCache } = require('../utils/cache')

const TTL_CATEGORIES_MS = 5 * 60 * 1000   // 5 min
const TTL_PLATFORM_CONFIG_MS = 5 * 60 * 1000

// College pilot (Parul University): Academic, Hostel, Errands, Tech, Events
const DEFAULT_CATEGORIES = [
  'Academic',
  'Hostel',
  'Errands',
  'Tech',
  'Events'
]

// GET /api/categories - Public list of task categories (from Config or default)
router.get('/categories', withCache(() => 'categories', TTL_CATEGORIES_MS, async (req, res) => {
  try {
    const doc = await Config.findOne({ key: 'taskCategories' }).lean()
    const categories = Array.isArray(doc?.value) && doc.value.length > 0
      ? doc.value.filter((c) => c != null && String(c).trim() !== '')
      : DEFAULT_CATEGORIES
    res.json({ categories })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to fetch categories'
    })
  }
}))

// GET /api/platform-config - Public platform config (commission %, etc.)
router.get('/platform-config', withCache(() => 'platform-config', TTL_PLATFORM_CONFIG_MS, async (req, res) => {
  try {
    let commissionPercent = 0
    const doc = await Config.findOne({ key: 'platformCommissionPercent' }).lean()
    if (doc && typeof doc.value === 'number') {
      commissionPercent = doc.value
    }
    res.json({
      platformCommissionPercent: commissionPercent
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to fetch platform config'
    })
  }
}))

module.exports = router
