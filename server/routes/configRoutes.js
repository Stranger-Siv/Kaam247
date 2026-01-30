const express = require('express')
const router = express.Router()
const Config = require('../models/Config')

const DEFAULT_CATEGORIES = [
  'Cleaning',
  'Delivery',
  'Helper / Labour',
  'Tutor / Mentor',
  'Tech Help',
  'Errands',
  'Event Help',
  'Custom Task'
]

// GET /api/categories - Public list of task categories (from Config or default)
router.get('/categories', async (req, res) => {
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
})

module.exports = router
