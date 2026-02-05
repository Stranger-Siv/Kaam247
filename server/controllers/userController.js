const User = require('../models/User')
const Task = require('../models/Task')
const UserFeedback = require('../models/UserFeedback')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const { parsePagination, paginationMeta } = require('../utils/pagination')

const createUser = async (req, res) => {
  try {
    const { name, email, phone, password, location, roleMode, role } = req.body

    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Please provide: name, email, and phone'
      })
    }

    // Hash password if provided, otherwise generate a temporary one
    let userPassword
    if (password) {
      const salt = await bcrypt.genSalt(10)
      userPassword = await bcrypt.hash(password, salt)
    } else {
      // Generate a temporary password for testing purposes
      const salt = await bcrypt.genSalt(10)
      userPassword = await bcrypt.hash('temp_password_' + Date.now(), salt)
    }

    // Validate location if provided
    let userLocation = null
    if (location && location.coordinates) {
      if (!Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
        return res.status(400).json({
          error: 'Invalid location',
          message: 'location.coordinates must be [longitude, latitude]'
        })
      }

      const [lng, lat] = location.coordinates
      const longitude = Number(lng)
      const latitude = Number(lat)

      if (isNaN(longitude) || isNaN(latitude)) {
        return res.status(400).json({
          error: 'Invalid coordinates',
          message: 'coordinates must be numbers'
        })
      }

      if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
        return res.status(400).json({
          error: 'Invalid coordinates',
          message: 'coordinates must be [longitude, latitude]'
        })
      }

      userLocation = {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
        area: location.area || null,
        city: location.city || null
      }
    }

    // Create user
    // Note: role = 'user' | 'admin' (admin set manually in DB)
    // roleMode = 'worker' | 'poster' (user's mode in the app)
    const user = new User({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password: userPassword, // Will be hashed in production
      location: userLocation,
      role: role || 'user', // Default to 'user' (admin set manually in DB)
      roleMode: roleMode || 'worker', // User mode: worker or poster
      locationUpdatedAt: userLocation ? new Date() : null
    })

    const savedUser = await user.save()

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        _id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        roleMode: savedUser.roleMode
      }
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({
        error: 'Validation error',
        message: validationErrors.join(', ')
      })
    }

    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Duplicate email',
        message: 'A user with this email already exists'
      })
    }

    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while creating the user'
    })
  }
}

// PUT /api/users/me - Update authenticated user's profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.userId // From auth middleware
    const { name, phone, profilePhoto, location, workerPreferences } = req.body

    // Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Invalid userId',
        message: 'User ID is required'
      })
    }

    // Find user
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      })
    }

    // Build update object
    const updateData = {}
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          error: 'Invalid name',
          message: 'Name cannot be empty'
        })
      }
      updateData.name = name.trim()
    }

    // Phone cannot be updated by user (security). Use "Request phone change" ticket; admin can update.
    if (phone !== undefined) {
      return res.status(403).json({
        error: 'Phone update not allowed',
        message: 'Phone cannot be changed by you. Request a change via Profile → Request phone change; admin will review.'
      })
    }

    if (profilePhoto !== undefined) {
      updateData.profilePhoto = profilePhoto || null
    }

    // Handle worker preferences (worker-only; applied for any user for simplicity)
    if (workerPreferences !== undefined && workerPreferences !== null) {
      const prefs = {}
      if (Array.isArray(workerPreferences.preferredCategories)) {
        prefs['workerPreferences.preferredCategories'] = workerPreferences.preferredCategories
          .filter(c => typeof c === 'string' && c.trim())
          .map(c => c.trim())
          .slice(0, 20) // cap at 20
      }
      if (workerPreferences.defaultRadiusKm != null) {
        const km = Number(workerPreferences.defaultRadiusKm)
        if (!isNaN(km) && km >= 1 && km <= 10) {
          prefs['workerPreferences.defaultRadiusKm'] = Math.floor(km)
        }
      }
      if (Object.keys(prefs).length > 0) {
        Object.assign(updateData, prefs)
      }
    }

    // Handle location update
    if (location !== undefined) {
      if (location === null) {
        // Clear location
        updateData.location = null
        updateData.locationUpdatedAt = null
      } else if (location.lat !== undefined && location.lng !== undefined) {
        // Validate coordinates
        const lat = Number(location.lat)
        const lng = Number(location.lng)

        if (isNaN(lat) || isNaN(lng)) {
          return res.status(400).json({
            error: 'Invalid coordinates',
            message: 'Latitude and longitude must be numbers'
          })
        }

        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          return res.status(400).json({
            error: 'Invalid coordinates',
            message: 'Latitude must be between -90 and 90, longitude between -180 and 180'
          })
        }

        // Update location (MongoDB GeoJSON format: [longitude, latitude])
        updateData.location = {
          type: 'Point',
          coordinates: [lng, lat], // MongoDB uses [longitude, latitude]
          area: location.area || user.location?.area || null,
          city: location.city || user.location?.city || null
        }
        updateData.locationUpdatedAt = new Date()
      } else {
        return res.status(400).json({
          error: 'Invalid location',
          message: 'Location must have lat and lng properties'
        })
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password')

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Duplicate field',
        message: 'This phone number is already registered'
      })
    }

    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while updating profile'
    })
  }
}

const CSV_EXPORT_MAX_ROWS = 2000

function buildCategorizedActivity(postedTasks, acceptedTasks, userId) {
  return {
    posted: postedTasks.map(task => ({
      id: task._id,
      title: task.title,
      category: task.category,
      budget: task.budget,
      status: task.status,
      workerCompleted: task.workerCompleted || false,
      role: 'Poster',
      date: task.createdAt,
      acceptedBy: task.acceptedBy?.name || null,
      acceptedById: task.acceptedBy?._id || null,
      completedAt: task.completedAt || null
    })),
    accepted: acceptedTasks.map(task => ({
      id: task._id,
      title: task.title,
      category: task.category,
      budget: task.budget,
      status: task.status,
      role: 'Worker',
      date: task.createdAt,
      postedBy: task.postedBy?.name || null,
      completedAt: task.completedAt || null,
      rating: task.rating || null
    })),
    completed: [
      ...postedTasks.filter(t => t.status === 'COMPLETED').map(task => ({
        id: task._id,
        title: task.title,
        category: task.category,
        budget: task.budget,
        status: task.status,
        role: 'Poster',
        date: task.completedAt || task.createdAt,
        postedBy: task.postedBy?.name || null,
        acceptedBy: task.acceptedBy?.name || null,
        rating: task.rating || null
      })),
      ...acceptedTasks.filter(t => t.status === 'COMPLETED').map(task => ({
        id: task._id,
        title: task.title,
        category: task.category,
        budget: task.budget,
        status: task.status,
        role: 'Worker',
        date: task.completedAt || task.createdAt,
        postedBy: task.postedBy?.name || null,
        acceptedBy: task.acceptedBy?.name || null,
        rating: task.rating || null
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)),
    cancelled: [
      ...postedTasks.filter(t =>
        ['CANCELLED', 'CANCELLED_BY_POSTER', 'CANCELLED_BY_WORKER', 'CANCELLED_BY_ADMIN'].includes(t.status)
      ),
      ...acceptedTasks.filter(t =>
        ['CANCELLED', 'CANCELLED_BY_POSTER', 'CANCELLED_BY_WORKER', 'CANCELLED_BY_ADMIN'].includes(t.status)
      )
    ].map(task => ({
      id: task._id,
      title: task.title,
      category: task.category,
      budget: task.budget,
      status: task.status,
      role: task.postedBy?._id?.toString() === userId ? 'Poster' : 'Worker',
      date: task.createdAt,
      postedBy: task.postedBy?.name || null,
      acceptedBy: task.acceptedBy?.name || null
    })).sort((a, b) => new Date(b.date) - new Date(a.date))
  }
}

// GET /api/users/me/activity - Get user's activity history (optional: dateFrom, dateTo, page, limit, export=csv)
const getActivity = async (req, res) => {
  try {
    const userId = req.userId
    const { dateFrom, dateTo, export: exportFormat } = req.query

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Invalid userId',
        message: 'User ID is required'
      })
    }

    const dateFilter = {}
    if (dateFrom) dateFilter.$gte = new Date(dateFrom)
    if (dateTo) {
      const end = new Date(dateTo)
      end.setHours(23, 59, 59, 999)
      dateFilter.$lte = end
    }
    const createdAtQuery = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}

    const activityFields = '_id title category budget status workerCompleted createdAt completedAt rating'
    const isCsvExport = exportFormat === 'csv'
    const { page, limit, skip } = parsePagination(req.query)

    const postedQuery = { postedBy: userId, ...createdAtQuery }
    const acceptedQuery = { acceptedBy: userId, ...createdAtQuery }

    if (isCsvExport) {
      const postedTasks = await Task.find(postedQuery)
        .select(activityFields)
        .populate('acceptedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(CSV_EXPORT_MAX_ROWS)
        .lean()
      const acceptedTasks = await Task.find(acceptedQuery)
        .select(activityFields)
        .populate('postedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(CSV_EXPORT_MAX_ROWS)
        .lean()
      const categorized = buildCategorizedActivity(postedTasks, acceptedTasks, userId)
      const rows = [
        ['Role', 'Title', 'Category', 'Budget', 'Status', 'Date', 'Posted By', 'Accepted By', 'Rating'].join(',')
      ]
      const all = [
        ...categorized.posted.map(t => ['Poster', t.title, t.category, t.budget, t.status, t.date, '-', t.acceptedBy || '-', t.rating || '-']),
        ...categorized.accepted.map(t => ['Worker', t.title, t.category, t.budget, t.status, t.date, t.postedBy || '-', '-', t.rating || '-']),
        ...categorized.completed.map(t => [t.role, t.title, t.category, t.budget, t.status, t.date, t.postedBy || '-', t.acceptedBy || '-', t.rating || '-']),
        ...categorized.cancelled.map(t => [t.role, t.title, t.category, t.budget, t.status, t.date, t.postedBy || '-', t.acceptedBy || '-', '-'])
      ]
      all.forEach(arr => rows.push(arr.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')))
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename=activity.csv')
      return res.status(200).send(rows.join('\n'))
    }

    const [totalPosted, totalAccepted, postedTasks, acceptedTasks] = await Promise.all([
      Task.countDocuments(postedQuery),
      Task.countDocuments(acceptedQuery),
      Task.find(postedQuery)
        .select(activityFields)
        .populate('acceptedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Task.find(acceptedQuery)
        .select(activityFields)
        .populate('postedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ])

    const categorized = buildCategorizedActivity(postedTasks, acceptedTasks, userId)
    const hasMorePosted = (page - 1) * limit + postedTasks.length < totalPosted
    const hasMoreAccepted = (page - 1) * limit + acceptedTasks.length < totalAccepted

    return res.status(200).json({
      message: 'Activity fetched successfully',
      activity: categorized,
      pagination: {
        page,
        limit,
        totalPosted,
        totalAccepted,
        hasMorePosted,
        hasMoreAccepted
      }
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while fetching activity'
    })
  }
}

// GET /api/users/me/earnings - Get worker's earnings (paginated task list)
const getEarnings = async (req, res) => {
  try {
    const userId = req.userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Invalid userId',
        message: 'User ID is required'
      })
    }

    const { page, limit, skip } = parsePagination(req.query)
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - 7)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const match = { acceptedBy: userId, status: 'COMPLETED' }

    const [totalCount, summary, pageTasks] = await Promise.all([
      Task.countDocuments(match),
      Task.aggregate([
        { $match: match },
        {
          $facet: {
            total: [{ $group: { _id: null, sum: { $sum: '$budget' } } }],
            today: [{ $match: { completedAt: { $gte: startOfToday } } }, { $group: { _id: null, sum: { $sum: '$budget' } } }],
            week: [{ $match: { completedAt: { $gte: startOfWeek } } }, { $group: { _id: null, sum: { $sum: '$budget' } } }],
            month: [{ $match: { completedAt: { $gte: startOfMonth } } }, { $group: { _id: null, sum: { $sum: '$budget' } } }],
            byCat: [{ $group: { _id: { $ifNull: ['$category', 'Other'] }, total: { $sum: '$budget' } } }],
            last7: [
              { $match: { completedAt: { $gte: new Date(now.getTime() - 7 * 24 * 3600000) } } },
              { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }, total: { $sum: '$budget' }, count: { $sum: 1 } } },
              { $sort: { _id: 1 } }
            ],
            last30: [
              { $match: { completedAt: { $gte: new Date(now.getTime() - 30 * 24 * 3600000) } } },
              { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }, total: { $sum: '$budget' }, count: { $sum: 1 } } },
              { $sort: { _id: 1 } }
            ]
          }
        }
      ]),
      Task.find(match)
        .select('_id title category budget completedAt rating')
        .populate('postedBy', 'name')
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ])

    const totalEarnings = summary[0]?.total?.[0]?.sum ?? 0
    const earningsToday = summary[0]?.today?.[0]?.sum ?? 0
    const earningsThisWeek = summary[0]?.week?.[0]?.sum ?? 0
    const earningsThisMonth = summary[0]?.month?.[0]?.sum ?? 0
    const byCategory = {}
      ; (summary[0]?.byCat || []).forEach(({ _id, total }) => { byCategory[_id] = total })
    const last7Days = (summary[0]?.last7 || []).map(({ _id, total, count }) => ({ date: _id, total, count }))
    const last30Days = (summary[0]?.last30 || []).map(({ _id, total, count }) => ({ date: _id, total, count }))
    const taskList = pageTasks.map(task => ({
      id: task._id,
      title: task.title,
      category: task.category,
      budget: task.budget,
      completedAt: task.completedAt || task.createdAt,
      postedBy: task.postedBy?.name || 'User',
      rating: task.rating || null
    }))

    return res.status(200).json({
      message: 'Earnings fetched successfully',
      earnings: {
        total: totalEarnings,
        today: earningsToday,
        thisWeek: earningsThisWeek,
        thisMonth: earningsThisMonth,
        totalTasks: totalCount,
        tasks: taskList,
        byCategory,
        last7Days,
        last30Days
      },
      pagination: paginationMeta(page, limit, totalCount, taskList.length)
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while fetching earnings'
    })
  }
}

// GET /api/users/me/transactions - Get poster's transactions (spend on completed tasks)
const getTransactions = async (req, res) => {
  try {
    const userId = req.userId

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Invalid userId',
        message: 'User ID is required'
      })
    }

    const { page, limit, skip } = parsePagination(req.query)
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - 7)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const match = { postedBy: userId, status: 'COMPLETED' }

    const [totalCount, summary, pageTasks] = await Promise.all([
      Task.countDocuments(match),
      Task.aggregate([
        { $match: match },
        {
          $facet: {
            total: [{ $group: { _id: null, sum: { $sum: '$budget' } } }],
            today: [{ $match: { completedAt: { $gte: startOfToday } } }, { $group: { _id: null, sum: { $sum: '$budget' } } }],
            week: [{ $match: { completedAt: { $gte: startOfWeek } } }, { $group: { _id: null, sum: { $sum: '$budget' } } }],
            month: [{ $match: { completedAt: { $gte: startOfMonth } } }, { $group: { _id: null, sum: { $sum: '$budget' } } }],
            byCat: [{ $group: { _id: { $ifNull: ['$category', 'Other'] }, total: { $sum: '$budget' } } }],
            last7: [
              { $match: { completedAt: { $gte: new Date(now.getTime() - 7 * 24 * 3600000) } } },
              { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }, total: { $sum: '$budget' }, count: { $sum: 1 } } },
              { $sort: { _id: 1 } }
            ],
            last30: [
              { $match: { completedAt: { $gte: new Date(now.getTime() - 30 * 24 * 3600000) } } },
              { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }, total: { $sum: '$budget' }, count: { $sum: 1 } } },
              { $sort: { _id: 1 } }
            ]
          }
        }
      ]),
      Task.find(match)
        .select('_id title category budget completedAt')
        .populate('acceptedBy', 'name')
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ])

    const totalSpent = summary[0]?.total?.[0]?.sum ?? 0
    const spentToday = summary[0]?.today?.[0]?.sum ?? 0
    const spentThisWeek = summary[0]?.week?.[0]?.sum ?? 0
    const spentThisMonth = summary[0]?.month?.[0]?.sum ?? 0
    const byCategory = {}
      ; (summary[0]?.byCat || []).forEach(({ _id, total }) => { byCategory[_id] = total })
    const last7Days = (summary[0]?.last7 || []).map(({ _id, total, count }) => ({ date: _id, total, count }))
    const last30Days = (summary[0]?.last30 || []).map(({ _id, total, count }) => ({ date: _id, total, count }))
    const taskList = pageTasks.map(task => ({
      id: task._id,
      title: task.title,
      category: task.category,
      budget: task.budget,
      completedAt: task.completedAt || task.createdAt,
      worker: task.acceptedBy?.name || 'Worker',
      rating: task.rating || null
    }))

    return res.status(200).json({
      message: 'Transactions fetched successfully',
      transactions: {
        total: totalSpent,
        today: spentToday,
        thisWeek: spentThisWeek,
        thisMonth: spentThisMonth,
        totalTasks: totalCount,
        tasks: taskList,
        byCategory,
        last7Days,
        last30Days
      },
      pagination: paginationMeta(page, limit, totalCount, taskList.length)
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while fetching transactions'
    })
  }
}

// Compute worker badges from stats
async function getWorkerBadges(userId) {
  const user = await User.findById(userId).select('averageRating totalRatings').lean()
  if (!user) return []

  const completedAsWorker = await Task.find({
    acceptedBy: userId,
    status: 'COMPLETED'
  })
    .select('budget')
    .lean()

  const totalEarnings = completedAsWorker.reduce((s, t) => s + (t.budget || 0), 0)
  const cancelledByWorker = await Task.countDocuments({
    acceptedBy: userId,
    status: { $in: ['CANCELLED_BY_WORKER'] }
  })
  const acceptedCount = await Task.countDocuments({ acceptedBy: userId })
  const cancelRate = acceptedCount > 0 ? (cancelledByWorker / acceptedCount) * 100 : 0

  const avgAcceptTime = await Task.aggregate([
    { $match: { acceptedBy: mongoose.Types.ObjectId(userId), acceptedAt: { $exists: true } } },
    {
      $project: {
        ms: { $subtract: ['$acceptedAt', '$createdAt'] }
      }
    },
    { $group: { _id: null, avgMs: { $avg: '$ms' } } }
  ])
  const avgAcceptMs = avgAcceptTime[0]?.avgMs || null

  const badges = []
  if (user.averageRating >= 4.5 && (user.totalRatings || 0) >= 10) badges.push('TOP_RATED')
  if (cancelRate <= 10 && acceptedCount >= 5) badges.push('RELIABLE')
  if (avgAcceptMs != null && avgAcceptMs < 30 * 60 * 1000) badges.push('FAST_RESPONDER') // under 30 min
  if (totalEarnings >= 10000) badges.push('EARNED_10K')
  if (totalEarnings >= 5000) badges.push('EARNED_5K')
  if (totalEarnings >= 1000) badges.push('EARNED_1K')

  return badges
}

// POST /api/users/me/feedback - Submit profile feedback & suggestions (college pilot)
const submitProfileFeedback = async (req, res) => {
  try {
    const userId = req.userId
    const { rating, text } = req.body || {}
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user', message: 'User ID is required' })
    }
    const textStr = typeof text === 'string' ? text.trim().slice(0, 2000) : ''
    if (!textStr) {
      return res.status(400).json({ error: 'Missing text', message: 'Feedback text is required' })
    }
    const ratingNum = rating != null ? Number(rating) : null
    const validRating = (ratingNum >= 1 && ratingNum <= 5) ? Math.round(ratingNum) : undefined
    const feedback = new UserFeedback({
      user: userId,
      rating: validRating,
      text: textStr
    })
    await feedback.save()
    return res.status(201).json({ message: 'Thank you for your feedback' })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to submit feedback'
    })
  }
}

// POST /api/users/me/onboarding-feedback - Store onboarding feedback (college pilot)
const submitOnboardingFeedback = async (req, res) => {
  try {
    const userId = req.userId
    const { useCase, suggestions } = req.body || {}
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user', message: 'User ID is required' })
    }
    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ error: 'User not found', message: 'User not found' })
    const useCaseStr = typeof useCase === 'string' ? useCase.trim().slice(0, 500) : ''
    const suggestionsStr = typeof suggestions === 'string' ? suggestions.trim().slice(0, 1000) : ''
    if (!useCaseStr && !suggestionsStr) {
      return res.status(200).json({ message: 'No feedback to save' })
    }
    user.onboardingFeedback = {
      useCase: useCaseStr || undefined,
      suggestions: suggestionsStr || undefined,
      submittedAt: new Date()
    }
    await user.save()
    return res.status(200).json({ message: 'Feedback saved' })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to save onboarding feedback'
    })
  }
}

// GET /api/users/me - Get current user profile (includes worker badges and savedTasks)
const getProfile = async (req, res) => {
  try {
    const userId = req.userId // From auth middleware

    const user = await User.findById(userId).select('-password').lean()
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      })
    }

    // Build a plain object safe for JSON (convert ObjectIds to string); strip internal fields
    const response = JSON.parse(JSON.stringify(user))
    delete response.__v
    response.savedTasks = (user.savedTasks || []).map(id => (id && id.toString ? id.toString() : String(id)))

    if (user.roleMode === 'worker') {
      try {
        response.workerBadges = await getWorkerBadges(userId)
      } catch (e) {
        response.workerBadges = []
      }
    }

    return res.status(200).json({
      message: 'Profile fetched successfully',
      user: response
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while fetching profile'
    })
  }
}

// POST /api/users/me/saved-tasks/:taskId - Toggle bookmark (add if not saved, remove if saved)
const toggleSavedTask = async (req, res) => {
  try {
    const userId = req.userId
    const { taskId } = req.params
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ error: 'Invalid taskId', message: 'Invalid task ID' })
    }

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ error: 'User not found', message: 'User not found' })

    const id = new mongoose.Types.ObjectId(taskId)
    const saved = user.savedTasks || []
    const idx = saved.findIndex(s => s.toString() === taskId)
    if (idx >= 0) {
      user.savedTasks = saved.filter(s => s.toString() !== taskId)
    } else {
      user.savedTasks = [...saved, id]
    }
    await user.save()

    return res.status(200).json({
      message: idx >= 0 ? 'Removed from saved' : 'Saved task',
      savedTasks: user.savedTasks.map(s => s.toString())
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred'
    })
  }
}

// GET /api/users/me/availability-schedule - Get availability schedule
const getAvailabilitySchedule = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('availabilitySchedule').lean()
    if (!user) return res.status(404).json({ error: 'User not found', message: 'User not found' })
    return res.status(200).json({
      schedule: user.availabilitySchedule || { enabled: false, slots: [] }
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred'
    })
  }
}

// PATCH /api/users/me/availability-schedule - Update availability schedule
const updateAvailabilitySchedule = async (req, res) => {
  try {
    const { enabled, slots } = req.body
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'User not found', message: 'User not found' })

    user.availabilitySchedule = {
      enabled: !!enabled,
      slots: Array.isArray(slots)
        ? slots
          .filter(s => typeof s.dayOfWeek === 'number' && s.dayOfWeek >= 0 && s.dayOfWeek <= 6 && s.startTime && s.endTime)
          .map(s => ({ dayOfWeek: s.dayOfWeek, startTime: String(s.startTime), endTime: String(s.endTime) }))
        : (user.availabilitySchedule?.slots || [])
    }
    await user.save()

    return res.status(200).json({
      message: 'Availability schedule updated',
      schedule: user.availabilitySchedule
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred'
    })
  }
}

// GET /api/users/me/cancellation-status - Get worker's daily cancellation status
const getCancellationStatus = async (req, res) => {
  try {
    const userId = req.userId // From auth middleware

    const user = await User.findById(userId).select('dailyCancelCount lastCancelDate role')
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      })
    }

    // Check if it's a new day - reset counter if needed
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const lastCancelDate = user.lastCancelDate ? new Date(user.lastCancelDate) : null
    let lastCancelDay = null
    if (lastCancelDate) {
      lastCancelDay = new Date(lastCancelDate)
      lastCancelDay.setHours(0, 0, 0, 0)
    }

    if (!lastCancelDay || lastCancelDay.getTime() !== today.getTime()) {
      // New day - reset counter
      if (user.dailyCancelCount > 0) {
        user.dailyCancelCount = 0
        user.lastCancelDate = today
        await user.save()
      }
    }

    const cancelLimit = user.totalCancelLimit ?? 2 // Default to 2 if not set
    const remainingCancellations = Math.max(0, cancelLimit - user.dailyCancelCount)
    const canAcceptTasks = user.dailyCancelCount < cancelLimit

    return res.status(200).json({
      message: 'Cancellation status fetched successfully',
      dailyCancelCount: user.dailyCancelCount,
      remainingCancellations,
      canAcceptTasks,
      limitReached: !canAcceptTasks
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while fetching cancellation status'
    })
  }
}

// GET /api/users/me/active-task - Check if user has any active tasks
const getActiveTask = async (req, res) => {
  try {
    const userId = req.userId // From auth middleware

    // Check for active tasks as a worker (acceptedBy + status in [ACCEPTED, IN_PROGRESS])
    const workerActiveTask = await Task.findOne({
      acceptedBy: userId,
      status: { $in: ['ACCEPTED', 'IN_PROGRESS'] }
    }).select('_id title status')

    // Check for active tasks as a poster (postedBy + status in [ACCEPTED, IN_PROGRESS])
    const posterActiveTask = await Task.findOne({
      postedBy: userId,
      status: { $in: ['ACCEPTED', 'IN_PROGRESS'] }
    }).select('_id title status')

    const hasActiveTask = !!(workerActiveTask || posterActiveTask)
    const activeTask = workerActiveTask || posterActiveTask
    const role = workerActiveTask ? 'worker' : (posterActiveTask ? 'poster' : null)

    return res.status(200).json({
      hasActiveTask,
      activeTaskId: activeTask ? activeTask._id.toString() : null,
      activeTaskTitle: activeTask ? activeTask.title : null,
      activeTaskStatus: activeTask ? activeTask.status : null,
      role
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while checking active task'
    })
  }
}

// Max FCM tokens per user (phone + tablet + 2 browsers, etc.)
const MAX_FCM_TOKENS = 10

// POST /api/users/me/push-subscription - Save FCM token for push notifications (multi-device)
const savePushSubscription = async (req, res) => {
  try {
    const userId = req.userId
    const { token } = req.body
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user' })
    }
    const fcmToken = token && typeof token === 'string' ? token.trim() : null
    if (fcmToken) {
      const user = await User.findById(userId).select('fcmTokens').lean()
      let tokens = (user && user.fcmTokens) ? [...user.fcmTokens] : []
      if (!tokens.includes(fcmToken)) {
        tokens.push(fcmToken)
        if (tokens.length > MAX_FCM_TOKENS) tokens = tokens.slice(-MAX_FCM_TOKENS)
      }
      await User.findByIdAndUpdate(userId, {
        $set: { fcmToken: fcmToken, fcmTokens: tokens }
      })
    } else {
      await User.findByIdAndUpdate(userId, { $set: { fcmToken: null, fcmTokens: [] } })
    }
    return res.status(200).json({
      message: fcmToken ? 'Push subscription saved' : 'Push subscription cleared'
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to save push subscription'
    })
  }
}

// POST /api/users/me/templates - Save a task template
const saveTaskTemplate = async (req, res) => {
  try {
    const userId = req.userId
    const { name, title, description, category, budget, expectedDuration, location } = req.body

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' })
    }

    if (!name || !title || !description || !category || !budget) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name, title, description, category, and budget are required'
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Limit to 10 templates per user
    if (user.taskTemplates && user.taskTemplates.length >= 10) {
      return res.status(400).json({
        error: 'Template limit reached',
        message: 'You can save up to 10 templates. Delete one to add a new one.'
      })
    }

    const template = {
      name: name.trim().slice(0, 50),
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      budget: Number(budget),
      expectedDuration: expectedDuration ? Number(expectedDuration) : undefined,
      location: location ? {
        area: location.area || '',
        city: location.city || '',
        fullAddress: location.fullAddress || ''
      } : undefined
    }

    if (isNaN(template.budget) || template.budget < 50) {
      return res.status(400).json({ error: 'Invalid budget', message: 'Minimum budget is ₹50' })
    }

    user.taskTemplates = user.taskTemplates || []
    user.taskTemplates.push(template)

    await user.save()

    res.status(200).json({
      message: 'Template saved successfully',
      template: template
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to save template'
    })
  }
}

// GET /api/users/me/templates - Get all task templates
const getTaskTemplates = async (req, res) => {
  try {
    const userId = req.userId

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' })
    }

    const user = await User.findById(userId).select('taskTemplates').lean()
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.status(200).json({
      templates: user.taskTemplates || []
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to fetch templates'
    })
  }
}

// DELETE /api/users/me/templates/:templateId - Delete a task template
const deleteTaskTemplate = async (req, res) => {
  try {
    const userId = req.userId
    const { templateId } = req.params

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' })
    }

    if (!templateId) {
      return res.status(400).json({ error: 'Template ID is required' })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    user.taskTemplates = (user.taskTemplates || []).filter(
      (t, idx) => idx.toString() !== templateId
    )

    await user.save()

    res.status(200).json({
      message: 'Template deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to delete template'
    })
  }
}

module.exports = {
  createUser,
  updateProfile,
  getActivity,
  getEarnings,
  getTransactions,
  getProfile,
  submitOnboardingFeedback,
  submitProfileFeedback,
  getCancellationStatus,
  getActiveTask,
  savePushSubscription,
  saveTaskTemplate,
  getTaskTemplates,
  deleteTaskTemplate,
  toggleSavedTask,
  getAvailabilitySchedule,
  updateAvailabilitySchedule
}

