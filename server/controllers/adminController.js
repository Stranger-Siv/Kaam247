const User = require('../models/User')
const Task = require('../models/Task')
const Report = require('../models/Report')
const Config = require('../models/Config')
const Chat = require('../models/Chat')
const AdminLog = require('../models/AdminLog')
const UserFeedback = require('../models/UserFeedback')
const mongoose = require('mongoose')
const { notifyUserUpdated, notifyTaskUpdated, notifyTaskCancelled, notifyAdminStatsRefresh } = require('../socket/socketHandler')
const { parsePagination, paginationMeta } = require('../utils/pagination')
const { invalidateSettingsKeys, invalidatePilotDashboard, invalidateStatsAndAdminDashboards } = require('../utils/cache')
const { runAfterResponse } = require('../utils/background')

// ============================================
// ADMIN USER MANAGEMENT
// ============================================

// GET /api/admin/users - List all users with filters and pagination
const getUsers = async (req, res) => {
  try {
    const { search = '', role, status, highCancellation = false } = req.query
    const { page, limit, skip } = parsePagination(req.query)

    // Build query
    const query = {}

    // Search by name, email, or phone
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ]
    }

    // Filter by role (only 'user' or 'admin' are valid)
    if (role && ['user', 'admin'].includes(role)) {
      query.role = role
    }

    // Filter by status
    if (status) {
      query.status = status
    }

    // Filter high cancellation users (>= 2 today)
    if (highCancellation === 'true') {
      query.dailyCancelCount = { $gte: 2 }
    }

    const userListFields = '_id name email phone role status createdAt averageRating'
    const users = await User.find(query)
      .select(userListFields)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const userIds = users.map((u) => u._id)
    let userStatsMap = {}
    if (userIds.length > 0) {
      const [statsFacet] = await Task.aggregate([
        {
          $facet: {
            posted: [{ $match: { postedBy: { $in: userIds } } }, { $group: { _id: '$postedBy', count: { $sum: 1 } } }],
            accepted: [{ $match: { acceptedBy: { $in: userIds } } }, { $group: { _id: '$acceptedBy', count: { $sum: 1 } } }],
            completed: [{ $match: { acceptedBy: { $in: userIds }, status: 'COMPLETED' } }, { $group: { _id: '$acceptedBy', count: { $sum: 1 } } }],
            cancelledPoster: [{ $match: { postedBy: { $in: userIds }, status: { $in: ['CANCELLED', 'CANCELLED_BY_POSTER', 'CANCELLED_BY_WORKER', 'CANCELLED_BY_ADMIN'] } } }, { $group: { _id: '$postedBy', count: { $sum: 1 } } }],
            cancelledWorker: [{ $match: { acceptedBy: { $in: userIds }, status: { $in: ['CANCELLED', 'CANCELLED_BY_POSTER', 'CANCELLED_BY_WORKER', 'CANCELLED_BY_ADMIN'] } } }, { $group: { _id: '$acceptedBy', count: { $sum: 1 } } }]
          }
        }
      ])
      const toMap = (arr) => (arr || []).reduce((m, { _id, count }) => { m[_id.toString()] = count; return m }, {})
      const posted = toMap(statsFacet?.posted)
      const accepted = toMap(statsFacet?.accepted)
      const completed = toMap(statsFacet?.completed)
      const cancelledPoster = toMap(statsFacet?.cancelledPoster)
      const cancelledWorker = toMap(statsFacet?.cancelledWorker)
      userIds.forEach((id) => {
        const sid = id.toString()
        userStatsMap[sid] = {
          tasksPosted: posted[sid] ?? 0,
          tasksAccepted: accepted[sid] ?? 0,
          tasksCompleted: completed[sid] ?? 0,
          tasksCancelled: (cancelledPoster[sid] ?? 0) + (cancelledWorker[sid] ?? 0),
          averageRating: 0
        }
      })
    }

    const usersWithStats = users.map((user) => {
      const s = userStatsMap[user._id.toString()] || { tasksPosted: 0, tasksAccepted: 0, tasksCompleted: 0, tasksCancelled: 0, averageRating: 0 }
      return {
        ...user,
        stats: {
          ...s,
          averageRating: user.averageRating || s.averageRating || 0
        }
      }
    })

    const total = await User.countDocuments(query)

    res.json({
      users: usersWithStats,
      pagination: paginationMeta(page, limit, total, usersWithStats.length)
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to fetch users'
    })
  }
}

// GET /api/admin/users/:userId - Get user details
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'Invalid user ID format'
      })
    }

    const user = await User.findById(userId).select('-password').lean()
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User does not exist'
      })
    }

    const userObject = { ...user }
    if (userObject.dailyCancelCount === undefined || userObject.dailyCancelCount === null) {
      userObject.dailyCancelCount = 0
    }
    if (userObject.totalCancelLimit === undefined || userObject.totalCancelLimit === null) {
      userObject.totalCancelLimit = 2 // Default to 2 if not set
    }

    const tasksPosted = await Task.find({ postedBy: userId })
      .select('title status budget createdAt')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    const tasksAccepted = await Task.find({ acceptedBy: userId })
      .select('title status budget createdAt')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    const cancellationHistory = await Task.find({
      $or: [
        { postedBy: userId, status: { $in: ['CANCELLED', 'CANCELLED_BY_ADMIN'] } },
        { acceptedBy: userId, status: { $in: ['CANCELLED', 'CANCELLED_BY_ADMIN'] } }
      ]
    })
      .select('title status createdAt')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    const ratingsReceived = await Task.find({
      acceptedBy: userId,
      rating: { $exists: true, $ne: null }
    })
      .select('rating review ratedAt')
      .sort({ ratedAt: -1 })
      .lean()

    const now = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const completedAsWorker = await Task.find({
      acceptedBy: userId,
      status: 'COMPLETED'
    })
      .select('budget completedAt')
      .lean()

    const completedAsPoster = await Task.find({
      postedBy: userId,
      status: 'COMPLETED'
    })
      .select('budget completedAt')
      .lean()

    const sumBudgets = (tasks = []) =>
      tasks.reduce((sum, t) => sum + (t.budget || 0), 0)

    const earningsAsWorkerTotal = sumBudgets(completedAsWorker)
    const earningsAsWorkerLast30Days = sumBudgets(
      completedAsWorker.filter(
        (t) => t.completedAt && t.completedAt >= thirtyDaysAgo && t.completedAt <= now
      )
    )

    const spentAsPosterTotal = sumBudgets(completedAsPoster)
    const spentAsPosterLast30Days = sumBudgets(
      completedAsPoster.filter(
        (t) => t.completedAt && t.completedAt >= thirtyDaysAgo && t.completedAt <= now
      )
    )

    res.json({
      user: userObject,
      activity: {
        tasksPosted,
        tasksAccepted,
        cancellationHistory,
        ratingsReceived,
        earnings: {
          earningsAsWorkerTotal,
          earningsAsWorkerLast30Days,
          spentAsPosterTotal,
          spentAsPosterLast30Days
        }
      }
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to fetch user details'
    })
  }
}

// PATCH /api/admin/users/:userId - Update user (admin only: name, phone)
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params
    const { name, phone } = req.body

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'Invalid user ID format'
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User does not exist'
      })
    }

    const updateData = {}
    if (name !== undefined && name !== null && String(name).trim()) {
      updateData.name = String(name).trim()
    }
    if (phone !== undefined && phone !== null) {
      const digits = String(phone).replace(/\D/g, '')
      if (digits.length !== 10) {
        return res.status(400).json({
          error: 'Invalid phone',
          message: 'Provide a valid 10-digit phone'
        })
      }
      const existing = await User.findOne({ phone: digits, _id: { $ne: userId } })
      if (existing) {
        return res.status(400).json({
          error: 'Phone taken',
          message: 'This phone number is already registered to another user'
        })
      }
      updateData.phone = digits
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'No updates',
        message: 'Provide name and/or phone to update'
      })
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password')

    return res.status(200).json({
      message: 'User updated successfully',
      user: updated
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to update user'
    })
  }
}

// PATCH /api/admin/users/:userId/block - Block user
const blockUser = async (req, res) => {
  try {
    const { userId } = req.params

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'Invalid user ID format'
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User does not exist'
      })
    }

    // Block user
    user.status = 'blocked'

    // Ensure role is valid (fix any legacy 'worker'/'poster' values)
    if (user.role && !['user', 'admin'].includes(user.role)) {
      user.role = 'user' // Default to 'user' if invalid
    }

    await user.save()

    runAfterResponse('blockUser:notify', () => {
      try {
        notifyUserUpdated(userId, { status: 'blocked' })
        notifyAdminStatsRefresh()
        invalidateStatsAndAdminDashboards()
      } catch (e) { }
    })

    res.json({
      message: 'User blocked successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status
      }
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to block user'
    })
  }
}

// PATCH /api/admin/users/:userId/unblock - Unblock user
const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'Invalid user ID format'
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User does not exist'
      })
    }

    // Unblock user
    user.status = 'active'

    // Ensure role is valid (fix any legacy 'worker'/'poster' values)
    if (user.role && !['user', 'admin'].includes(user.role)) {
      user.role = 'user' // Default to 'user' if invalid
    }

    await user.save()

    runAfterResponse('unblockUser:notify', () => {
      try {
        notifyUserUpdated(userId, { status: 'active' })
        notifyAdminStatsRefresh()
        invalidateStatsAndAdminDashboards()
      } catch (e) { }
    })

    res.json({
      message: 'User unblocked successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status
      }
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to unblock user'
    })
  }
}

// PATCH /api/admin/users/:userId/ban - Ban user
const banUser = async (req, res) => {
  try {
    const { userId } = req.params

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'Invalid user ID format'
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User does not exist'
      })
    }

    // Ban user
    user.status = 'banned'

    // Ensure role is valid (fix any legacy 'worker'/'poster' values)
    if (user.role && !['user', 'admin'].includes(user.role)) {
      user.role = 'user' // Default to 'user' if invalid
    }

    await user.save()

    runAfterResponse('banUser:notify', () => {
      try {
        notifyUserUpdated(userId, { status: 'banned' })
        notifyAdminStatsRefresh()
        invalidateStatsAndAdminDashboards()
      } catch (e) { }
    })

    res.json({
      message: 'User banned successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status
      }
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to ban user'
    })
  }
}

// PATCH /api/admin/users/:userId/reset-cancellations - Reset daily cancellation count
const resetCancellations = async (req, res) => {
  try {
    const { userId } = req.params

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'Invalid user ID format'
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User does not exist'
      })
    }

    // Reset cancellation count
    user.dailyCancelCount = 0
    user.lastCancelDate = null

    // Ensure role is valid (fix any legacy 'worker'/'poster' values)
    if (user.role && !['user', 'admin'].includes(user.role)) {
      user.role = 'user' // Default to 'user' if invalid
    }

    await user.save()

    // Reload user to ensure we have the latest data
    const updatedUser = await User.findById(userId).select('-password')

    runAfterResponse('resetCancellations:notify', () => {
      try { notifyAdminStatsRefresh() } catch (e) { }
    })

    res.json({
      message: 'Cancellation count reset successfully',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        dailyCancelCount: updatedUser.dailyCancelCount ?? 0,
        lastCancelDate: updatedUser.lastCancelDate ?? null
      }
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to reset cancellations'
    })
  }
}

// PATCH /api/admin/users/:userId/update-cancel-limit - Update user's cancellation limit
const updateCancelLimit = async (req, res) => {
  try {
    const { userId } = req.params
    const { totalCancelLimit } = req.body

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'Invalid user ID format'
      })
    }

    // Validate totalCancelLimit
    if (totalCancelLimit === undefined || totalCancelLimit === null) {
      return res.status(400).json({
        error: 'Missing totalCancelLimit',
        message: 'totalCancelLimit is required in request body'
      })
    }

    const limitNum = parseInt(totalCancelLimit)
    if (isNaN(limitNum) || limitNum < 0 || limitNum > 10) {
      return res.status(400).json({
        error: 'Invalid totalCancelLimit',
        message: 'totalCancelLimit must be a number between 0 and 10'
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User does not exist'
      })
    }

    // Update cancellation limit
    user.totalCancelLimit = limitNum

    // Ensure role is valid (fix any legacy 'worker'/'poster' values)
    if (user.role && !['user', 'admin'].includes(user.role)) {
      user.role = 'user' // Default to 'user' if invalid
    }

    await user.save()

    // Reload user to ensure we have the latest data
    const updatedUser = await User.findById(userId).select('-password')

    runAfterResponse('updateCancelLimit:notify', () => {
      try {
        notifyUserUpdated(userId, { totalCancelLimit: limitNum })
        notifyAdminStatsRefresh()
      } catch (e) { }
    })

    res.json({
      message: 'Cancellation limit updated successfully',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        totalCancelLimit: updatedUser.totalCancelLimit ?? 2,
        dailyCancelCount: updatedUser.dailyCancelCount ?? 0
      }
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to update cancellation limit'
    })
  }
}

// ============================================
// ADMIN TASK MODERATION
// ============================================

// GET /api/admin/tasks - List all tasks with filters
const getTasks = async (req, res) => {
  try {
    const { status, category, city, minBudget, maxBudget, reportedOnly = false } = req.query
    const { page, limit, skip } = parsePagination(req.query)

    // Build query
    const query = {}

    if (status) {
      query.status = status
    }

    if (category) {
      query.category = category
    }

    if (city) {
      query['location.city'] = { $regex: city, $options: 'i' }
    }

    if (minBudget || maxBudget) {
      query.budget = {}
      if (minBudget) query.budget.$gte = Number(minBudget)
      if (maxBudget) query.budget.$lte = Number(maxBudget)
    }

    // If reportedOnly, get tasks that have reports
    if (reportedOnly === 'true') {
      const reportedTaskIds = await Report.distinct('reportedTask', {
        reportedTask: { $exists: true, $ne: null }
      })
      query._id = { $in: reportedTaskIds }
    }

    const taskListFields = '_id title category budget status createdAt location.city postedBy acceptedBy'
    const tasks = await Task.find(query)
      .select(taskListFields)
      .populate('postedBy', 'name')
      .populate('acceptedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await Task.countDocuments(query)

    res.json({
      tasks,
      pagination: paginationMeta(page, limit, total, tasks.length)
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to fetch tasks'
    })
  }
}

// GET /api/admin/tasks/:taskId - Get task details
const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        error: 'Invalid task ID',
        message: 'Invalid task ID format'
      })
    }

    const task = await Task.findById(taskId)
      .populate('postedBy', 'name email phone status')
      .populate('acceptedBy', 'name email phone status')
      .lean()

    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
        message: 'Task does not exist'
      })
    }

    const timeline = []
    if (task.createdAt) {
      timeline.push({ event: 'Task Posted', timestamp: task.createdAt })
    }
    if (task.acceptedBy) {
      const acceptedTask = await Task.findOne({ _id: taskId, status: 'ACCEPTED' })
        .select('createdAt')
        .lean()
      if (acceptedTask) {
        timeline.push({ event: 'Task Accepted', timestamp: acceptedTask.createdAt })
      }
    }
    if (task.startedAt) {
      timeline.push({ event: 'Task Started', timestamp: task.startedAt })
    }
    if (task.completedAt) {
      timeline.push({ event: 'Task Completed', timestamp: task.completedAt })
    }

    // Strip internal fields from response
    delete task.__v
    if (task.postedBy && typeof task.postedBy === 'object') delete task.postedBy.__v
    if (task.acceptedBy && typeof task.acceptedBy === 'object') delete task.acceptedBy.__v

    res.json({
      task,
      timeline
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to fetch task details'
    })
  }
}

// PATCH /api/admin/tasks/:taskId/cancel - Force cancel task
const cancelTask = async (req, res) => {
  try {
    const { taskId } = req.params

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        error: 'Invalid task ID',
        message: 'Invalid task ID format'
      })
    }

    const task = await Task.findById(taskId)
      .populate('postedBy', 'name email')
      .populate('acceptedBy', 'name email')

    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
        message: 'Task does not exist'
      })
    }

    // Cancel task
    task.status = 'CANCELLED_BY_ADMIN'
    await task.save()

    const taskIdStr = task._id.toString()
    const postedById = task.postedBy?.toString()
    const acceptedById = task.acceptedBy?.toString()
    runAfterResponse('adminCancelTask:notify', () => {
      try {
        if (postedById) notifyTaskCancelled(postedById, taskIdStr, 'admin')
        if (acceptedById) notifyTaskCancelled(acceptedById, taskIdStr, 'admin')
        notifyTaskUpdated(taskIdStr, { status: 'CANCELLED_BY_ADMIN', postedBy: task.postedBy, acceptedBy: task.acceptedBy })
        notifyAdminStatsRefresh()
        invalidateStatsAndAdminDashboards()
      } catch (e) { }
    })

    res.json({
      message: 'Task cancelled by admin',
      task: {
        _id: task._id,
        title: task.title,
        status: task.status
      }
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to cancel task'
    })
  }
}

// PATCH /api/admin/tasks/:taskId/unassign - Remove worker from task
const unassignTask = async (req, res) => {
  try {
    const { taskId } = req.params

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        error: 'Invalid task ID',
        message: 'Invalid task ID format'
      })
    }

    const task = await Task.findById(taskId)

    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
        message: 'Task does not exist'
      })
    }

    // Unassign worker
    const previousWorkerId = task.acceptedBy
    task.acceptedBy = null
    task.status = 'SEARCHING'
    await task.save()

    const taskIdStr = task._id.toString()
    const postedByRef = task.postedBy
    runAfterResponse('unassignTask:notify', () => {
      try {
        if (previousWorkerId) notifyTaskUpdated(taskIdStr, { status: 'SEARCHING', acceptedBy: null, postedBy: postedByRef })
        notifyAdminStatsRefresh()
        invalidateStatsAndAdminDashboards()
      } catch (e) { }
    })

    res.json({
      message: 'Worker unassigned successfully',
      task: {
        _id: task._id,
        title: task.title,
        status: task.status,
        acceptedBy: null
      }
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to unassign task'
    })
  }
}

// PATCH /api/admin/tasks/:taskId/hide - Hide task from public listings
const hideTask = async (req, res) => {
  try {
    const { taskId } = req.params

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        error: 'Invalid task ID',
        message: 'Invalid task ID format'
      })
    }

    const task = await Task.findById(taskId)

    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
        message: 'Task does not exist'
      })
    }

    task.isHidden = !task.isHidden
    await task.save()

    runAfterResponse('hideTask:invalidate', () => {
      try { invalidateStatsAndAdminDashboards() } catch (e) { }
    })

    res.json({
      message: task.isHidden ? 'Task hidden successfully' : 'Task made visible',
      task: {
        _id: task._id,
        title: task.title,
        isHidden: task.isHidden
      }
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to hide task'
    })
  }
}

// ============================================
// ADMIN REPORTS
// ============================================

// GET /api/admin/reports - List all reports
const getReports = async (req, res) => {
  try {
    const { status = 'open', reason } = req.query
    const { page, limit, skip } = parsePagination(req.query)

    const query = {}
    if (status) query.status = status
    if (reason) query.reason = reason

    const [reports, total] = await Promise.all([
      Report.find(query)
        .select('reporter reportedUser reportedTask reason status createdAt resolvedAt adminNotes resolvedBy')
        .populate('reporter', 'name email')
        .populate('reportedUser', 'name email status')
        .populate('reportedTask', 'title status')
        .populate('resolvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Report.countDocuments(query)
    ])

    res.json({
      reports,
      pagination: paginationMeta(page, limit, total, reports.length)
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to fetch reports'
    })
  }
}

// PATCH /api/admin/reports/:id/resolve - Resolve report
const resolveReport = async (req, res) => {
  try {
    const { id } = req.params
    const { adminNotes, blockUser: shouldBlock, banUser: shouldBan } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Invalid report ID',
        message: 'Invalid report ID format'
      })
    }

    const report = await Report.findById(id)
      .populate('reportedUser')

    if (!report) {
      return res.status(404).json({
        error: 'Report not found',
        message: 'Report does not exist'
      })
    }

    if (report.status === 'resolved') {
      return res.status(400).json({
        error: 'Already resolved',
        message: 'This report has already been resolved'
      })
    }

    // Resolve report
    report.status = 'resolved'
    report.resolvedAt = new Date()
    report.resolvedBy = req.userId
    if (adminNotes) {
      report.adminNotes = adminNotes
    }
    await report.save()

    // Optionally block or ban user
    if (shouldBlock && report.reportedUser) {
      report.reportedUser.status = 'blocked'
      await report.reportedUser.save()
    }

    if (shouldBan && report.reportedUser) {
      report.reportedUser.status = 'banned'
      await report.reportedUser.save()
    }

    res.json({
      message: 'Report resolved successfully',
      report: report.toObject()
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to resolve report'
    })
  }
}

// ============================================
// ADMIN STATS
// ============================================

// GET /api/admin/stats - Get admin dashboard stats
// ABUSE METRICS: Get users hitting limits
const getAbuseMetrics = async () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Users hitting posting limits (>= 5 tasks today)
  const usersHittingPostingLimit = await User.countDocuments({
    dailyTaskPostCount: { $gte: 5 },
    lastTaskPostDate: { $gte: today }
  })

  // Users hitting cancellation limits (>= 2 today)
  const usersHittingCancellationLimit = await User.countDocuments({
    dailyCancelCount: { $gte: 2 },
    lastCancelDate: { $gte: today }
  })

  // Users hitting report limits (>= 3 today)
  const usersHittingReportLimit = await User.countDocuments({
    dailyReportCount: { $gte: 3 },
    lastReportDate: { $gte: today }
  })

  return {
    usersHittingPostingLimit,
    usersHittingCancellationLimit,
    usersHittingReportLimit
  }
}

// Public stats endpoint (no auth required)
const getPublicStats = async (req, res) => {
  try {
    // Total active users
    const totalUsers = await User.countDocuments({ role: 'user', isBlocked: { $ne: true }, isBanned: { $ne: true } })

    // Total completed tasks (all time)
    const totalCompletedTasks = await Task.countDocuments({ status: 'COMPLETED' })

    // Distinct task categories count
    const categories = await Task.distinct('category')
    const categoryCount = categories.length

    // Average rating from all completed tasks with ratings
    const completedTasksWithRatings = await Task.find({
      status: 'COMPLETED',
      rating: { $exists: true, $ne: null }
    })
      .select('rating')
      .lean()

    let averageRating = 0
    if (completedTasksWithRatings.length > 0) {
      const sumRatings = completedTasksWithRatings.reduce((sum, task) => sum + (task.rating || 0), 0)
      averageRating = sumRatings / completedTasksWithRatings.length
    }

    res.json({
      totalUsers,
      totalCompletedTasks,
      categoryCount,
      averageRating: averageRating > 0 ? parseFloat(averageRating.toFixed(1)) : 0
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to fetch public stats'
    })
  }
}

// GET /api/admin/dashboard - Full dashboard data (tasks by status, location, category, revenue, users, recent activity)
// Optimized: one $facet aggregation for Task metrics, one for User counts, then recent lists + config
const getDashboard = async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    const socketManager = require('../socket/socketManager')
    const onlineWorkersCount = socketManager.getOnlineWorkerCount()

    // Single Task $facet: status counts, category/location, revenue buckets, counts (indexed $match first)
    const [taskFacet] = await Task.aggregate([
      {
        $facet: {
          statusCounts: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          category: [
            { $group: { _id: '$category', count: { $sum: 1 }, revenue: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, '$budget', 0] } } } },
            { $sort: { count: -1 } },
            { $limit: 20 }
          ],
          location: [
            { $match: { 'location.city': { $exists: true, $ne: null, $ne: '' } } },
            { $group: { _id: '$location.city', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 25 }
          ],
          gmv: [{ $match: { status: 'COMPLETED' } }, { $group: { _id: null, total: { $sum: '$budget' } } }],
          earningsToday: [{ $match: { status: 'COMPLETED', completedAt: { $gte: today, $lt: tomorrow } } }, { $group: { _id: null, total: { $sum: '$budget' } } }],
          earningsWeek: [{ $match: { status: 'COMPLETED', completedAt: { $gte: weekStart } } }, { $group: { _id: null, total: { $sum: '$budget' } } }],
          earningsMonth: [{ $match: { status: 'COMPLETED', completedAt: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$budget' } } }],
          total: [{ $count: 'count' }],
          tasksToday: [{ $match: { createdAt: { $gte: today, $lt: tomorrow } } }, { $count: 'count' }],
          tasksWeek: [{ $match: { createdAt: { $gte: weekStart } } }, { $count: 'count' }],
          completedToday: [{ $match: { status: 'COMPLETED', completedAt: { $gte: today, $lt: tomorrow } } }, { $count: 'count' }],
          cancelledToday: [{ $match: { status: { $in: ['CANCELLED', 'CANCELLED_BY_POSTER', 'CANCELLED_BY_WORKER', 'CANCELLED_BY_ADMIN'] }, createdAt: { $gte: today, $lt: tomorrow } } }, { $count: 'count' }],
          posters: [{ $group: { _id: '$postedBy' } }, { $count: 'count' }],
          workers: [{ $match: { acceptedBy: { $ne: null } } }, { $group: { _id: '$acceptedBy' } }, { $count: 'count' }]
        }
      }
    ])

    const statusCounts = taskFacet?.statusCounts || []
    const tasksByStatus = {}
    const allStatuses = ['OPEN', 'SEARCHING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'CANCELLED_BY_POSTER', 'CANCELLED_BY_WORKER', 'CANCELLED_BY_ADMIN']
    allStatuses.forEach(s => { tasksByStatus[s] = 0 })
    statusCounts.forEach(({ _id, count }) => { tasksByStatus[_id] = count })

    const totalTasks = taskFacet?.total?.[0]?.count ?? 0
    const tasksToday = taskFacet?.tasksToday?.[0]?.count ?? 0
    const tasksThisWeek = taskFacet?.tasksWeek?.[0]?.count ?? 0
    const pendingTasks = (tasksByStatus.OPEN || 0) + (tasksByStatus.SEARCHING || 0)
    const ongoingTasks = (tasksByStatus.ACCEPTED || 0) + (tasksByStatus.IN_PROGRESS || 0)
    const completedTasks = tasksByStatus.COMPLETED || 0
    const cancelledTasks = (tasksByStatus.CANCELLED || 0) + (tasksByStatus.CANCELLED_BY_POSTER || 0) + (tasksByStatus.CANCELLED_BY_WORKER || 0) + (tasksByStatus.CANCELLED_BY_ADMIN || 0)
    const completedToday = taskFacet?.completedToday?.[0]?.count ?? 0
    const cancelledToday = taskFacet?.cancelledToday?.[0]?.count ?? 0

    const tasksByCategory = (taskFacet?.category || []).map(({ _id, count, revenue }) => ({ category: _id || 'Unknown', count, revenue: revenue || 0 }))
    const tasksByLocation = (taskFacet?.location || []).map(({ _id, count }) => ({ city: _id, count }))

    const totalGMV = taskFacet?.gmv?.[0]?.total || 0
    const earningsToday = taskFacet?.earningsToday?.[0]?.total || 0
    const earningsThisWeek = taskFacet?.earningsWeek?.[0]?.total || 0
    const earningsThisMonth = taskFacet?.earningsMonth?.[0]?.total || 0
    const totalPosters = taskFacet?.posters?.[0]?.count ?? 0
    const totalWorkers = taskFacet?.workers?.[0]?.count ?? 0

    // Single User $facet for user counts (indexed: role, status, createdAt)
    const [userFacet] = await User.aggregate([
      {
        $facet: {
          totalUsers: [{ $match: { role: 'user' } }, { $count: 'count' }],
          totalAdmins: [{ $match: { role: 'admin' } }, { $count: 'count' }],
          usersActive: [{ $match: { status: 'active' } }, { $count: 'count' }],
          usersBlocked: [{ $match: { status: 'blocked' } }, { $count: 'count' }],
          usersBanned: [{ $match: { status: 'banned' } }, { $count: 'count' }],
          newToday: [{ $match: { createdAt: { $gte: today, $lt: tomorrow } } }, { $count: 'count' }],
          newWeek: [{ $match: { createdAt: { $gte: weekStart } } }, { $count: 'count' }]
        }
      }
    ])
    const totalUsers = userFacet?.totalUsers?.[0]?.count ?? 0
    const totalAdmins = userFacet?.totalAdmins?.[0]?.count ?? 0
    const usersActive = userFacet?.usersActive?.[0]?.count ?? 0
    const usersBlocked = userFacet?.usersBlocked?.[0]?.count ?? 0
    const usersBanned = userFacet?.usersBanned?.[0]?.count ?? 0
    const newUsersToday = userFacet?.newToday?.[0]?.count ?? 0
    const newUsersThisWeek = userFacet?.newWeek?.[0]?.count ?? 0

    const [disputesCount, reportsTotal] = await Promise.all([
      Report.countDocuments({ status: 'open' }),
      Report.countDocuments()
    ])

    let platformCommissionPercent = 0
    try {
      const configDoc = await Config.findOne({ key: 'platformCommissionPercent' }).select('value').lean()
      if (configDoc && typeof configDoc.value === 'number') platformCommissionPercent = configDoc.value
    } catch (_) { }
    const platformCommissionTotal = Math.round((totalGMV * platformCommissionPercent) / 100)
    const totalPayoutToWorkers = totalGMV - platformCommissionTotal

    const recentTaskFields = '_id title category budget status createdAt postedBy acceptedBy'
    const recentTasks = await Task.find()
      .select(recentTaskFields)
      .populate('postedBy', 'name email phone')
      .populate('acceptedBy', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean()

    const recentUserFields = '_id name email phone createdAt'
    const recentUsers = await User.find({ role: 'user' })
      .select(recentUserFields)
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()

    const abuseMetrics = await getAbuseMetrics()

    res.json({
      overview: {
        totalUsers,
        totalAdmins,
        totalPosters,
        totalWorkers,
        onlineWorkers: onlineWorkersCount,
        totalTasks,
        tasksToday,
        tasksThisWeek,
        pendingTasks,
        ongoingTasks,
        activeTasks: ongoingTasks,
        completedTasks,
        cancelledTasks,
        completedToday,
        cancelledToday,
        earningsToday,
        totalGMV,
        totalPayoutToWorkers,
        platformCommissionTotal,
        platformCommissionPercent,
        pendingPayouts: 0,
        disputesCount,
        reportsTotal,
        earningsThisWeek,
        earningsThisMonth
      },
      tasksByStatus,
      tasksByCategory,
      tasksByLocation,
      revenue: {
        totalGMV,
        today: earningsToday,
        thisWeek: earningsThisWeek,
        thisMonth: earningsThisMonth
      },
      users: {
        total: totalUsers,
        admins: totalAdmins,
        active: usersActive,
        blocked: usersBlocked,
        banned: usersBanned,
        newToday: newUsersToday,
        newThisWeek: newUsersThisWeek
      },
      recentTasks,
      recentUsers,
      abuseMetrics
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to fetch dashboard'
    })
  }
}

// GET /api/admin/dashboard/charts?period=daily|weekly|monthly - Time-series for graphs
const getDashboardCharts = async (req, res) => {
  try {
    const period = (req.query.period || 'weekly').toLowerCase()
    const validPeriod = ['daily', 'weekly', 'monthly'].includes(period) ? period : 'weekly'

    const now = new Date()
    let startDate
    let dateFormat
    let groupFormat

    if (validPeriod === 'daily') {
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 30)
      startDate.setHours(0, 0, 0, 0)
      dateFormat = '%Y-%m-%d'
      groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
    } else if (validPeriod === 'weekly') {
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 84)
      startDate.setHours(0, 0, 0, 0)
      dateFormat = '%Y-W%V'
      groupFormat = { $dateToString: { format: '%Y-W%V', date: '$createdAt' } }
    } else {
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1)
      dateFormat = '%Y-%m'
      groupFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
    }

    // Revenue over time (completed tasks budget sum per bucket)
    const revenueTimeSeries = await Task.aggregate([
      { $match: { status: 'COMPLETED', completedAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: dateFormat === '%Y-%m-%d' ? '%Y-%m-%d' : dateFormat === '%Y-%m' ? '%Y-%m' : '%Y-W%V', date: '$completedAt' } }, total: { $sum: '$budget' } } },
      { $sort: { _id: 1 } }
    ]).then(arr => arr.map(({ _id, total }) => ({ date: _id, revenue: total })))

    // Tasks created per bucket
    const tasksCreatedTimeSeries = await Task.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: groupFormat, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).then(arr => arr.map(({ _id, count }) => ({ date: _id, created: count })))

    // Tasks completed per bucket
    const tasksCompletedTimeSeries = await Task.aggregate([
      { $match: { status: 'COMPLETED', completedAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: dateFormat === '%Y-%m-%d' ? '%Y-%m-%d' : dateFormat === '%Y-%m' ? '%Y-%m' : '%Y-W%V', date: '$completedAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).then(arr => arr.map(({ _id, count }) => ({ date: _id, completed: count })))

    // Tasks cancelled per bucket (by createdAt for simplicity)
    const tasksCancelledTimeSeries = await Task.aggregate([
      { $match: { status: { $in: ['CANCELLED', 'CANCELLED_BY_POSTER', 'CANCELLED_BY_WORKER', 'CANCELLED_BY_ADMIN'] }, createdAt: { $gte: startDate } } },
      { $group: { _id: groupFormat, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).then(arr => arr.map(({ _id, count }) => ({ date: _id, cancelled: count })))

    // User growth (new users per bucket)
    const userGrowthTimeSeries = await User.aggregate([
      { $match: { role: 'user', createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: dateFormat === '%Y-%m-%d' ? '%Y-%m-%d' : dateFormat === '%Y-%m' ? '%Y-%m' : '%Y-W%V', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).then(arr => arr.map(({ _id, count }) => ({ date: _id, users: count })))

    res.json({
      period: validPeriod,
      revenueTimeSeries,
      tasksCreatedTimeSeries,
      tasksCompletedTimeSeries,
      tasksCancelledTimeSeries,
      userGrowthTimeSeries
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to fetch chart data'
    })
  }
}

// GET /api/admin/pilot-dashboard?week=1 - Pilot success metrics (week 1 = last 7 days, 2 = 8-14 days ago, etc.)
// Only includes data on or after pilotStartDate (Config key 'pilotStartDate', ISO date string) when set.
const getPilotDashboard = async (req, res) => {
  try {
    let pilotStartDate = null
    const configDoc = await Config.findOne({ key: 'pilotStartDate' })
    if (configDoc && configDoc.value) {
      const d = new Date(configDoc.value)
      if (!isNaN(d.getTime())) pilotStartDate = d
    }
    const effStart = (rangeStart) => (pilotStartDate && pilotStartDate > rangeStart ? pilotStartDate : rangeStart)

    const weekNum = Math.min(4, Math.max(1, parseInt(req.query.week, 10) || 1))
    const now = new Date()
    const endDate = new Date(now)
    endDate.setHours(23, 59, 59, 999)
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - 7 * weekNum)
    startDate.setHours(0, 0, 0, 0)
    const weekEnd = new Date(startDate)
    weekEnd.setDate(weekEnd.getDate() + 7)
    weekEnd.setHours(23, 59, 59, 999)

    const periodStart = new Date(now)
    periodStart.setDate(periodStart.getDate() - 7 * weekNum)
    periodStart.setHours(0, 0, 0, 0)
    const periodEnd = new Date(periodStart)
    periodEnd.setDate(periodEnd.getDate() + 7)
    periodEnd.setMilliseconds(periodEnd.getMilliseconds() - 1)

    const start = periodStart
    const end = new Date(periodEnd)
    end.setHours(23, 59, 59, 999)
    const startEff = effStart(start)

    // ---- WAU + tasks posted + completion + avg accept time + repeat users: one $facet (no $push of full docs) ----
    const [pilotFacet] = await Task.aggregate([
      {
        $facet: {
          postedIds: [{ $match: { createdAt: { $gte: startEff, $lte: end } } }, { $group: { _id: '$postedBy' } }, { $project: { _id: 1 } }],
          acceptedIds: [{ $match: { acceptedAt: { $gte: startEff, $lte: end }, acceptedBy: { $ne: null } } }, { $group: { _id: '$acceptedBy' } }, { $project: { _id: 1 } }],
          tasksPosted: [{ $match: { createdAt: { $gte: startEff, $lte: end } } }, { $count: 'count' }],
          completed: [{ $match: { createdAt: { $gte: startEff, $lte: end }, status: 'COMPLETED' } }, { $count: 'count' }],
          cancelled: [{ $match: { createdAt: { $gte: startEff, $lte: end }, status: { $in: ['CANCELLED', 'CANCELLED_BY_POSTER', 'CANCELLED_BY_WORKER', 'CANCELLED_BY_ADMIN'] } } }, { $count: 'count' }],
          acceptTimes: [{ $match: { acceptedAt: { $gte: startEff, $lte: end } } }, { $project: { ms: { $subtract: ['$acceptedAt', '$createdAt'] } } }, { $group: { _id: null, avgMs: { $avg: '$ms' }, count: { $sum: 1 } } }],
          repeatUsers: [
            { $match: { $or: [{ createdAt: { $gte: startEff, $lte: end } }, { acceptedAt: { $gte: startEff, $lte: end } }] } },
            {
              $project: {
                ids: {
                  $concatArrays: [
                    { $cond: [{ $and: [{ $gte: ['$createdAt', startEff] }, { $lte: ['$createdAt', end] }] }, [{ $toString: '$postedBy' }], []] },
                    { $cond: [{ $and: [{ $ne: ['$acceptedBy', null] }, { $gte: ['$acceptedAt', startEff] }, { $lte: ['$acceptedAt', end] }] }, [{ $toString: '$acceptedBy' }], []] }
                  ]
                }
              }
            },
            { $unwind: '$ids' },
            { $match: { ids: { $ne: '' } } },
            { $group: { _id: '$ids', c: { $sum: 1 } } },
            { $match: { c: { $gte: 2 } } },
            { $count: 'count' }
          ]
        },
        acceptedInPeriodCount: [{ $match: { acceptedAt: { $gte: startEff, $lte: end } } }, { $count: 'count' }],
        topDoersSum: [{ $match: { acceptedAt: { $gte: startEff, $lte: end }, acceptedBy: { $ne: null } } }, { $group: { _id: '$acceptedBy', c: { $sum: 1 } } }, { $sort: { c: -1 } }, { $limit: 3 }, { $group: { _id: null, total: { $sum: '$c' } } }],
        categories: [{ $match: { createdAt: { $gte: startEff, $lte: end } } }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 5 }]
      }}
    ])

const postedInPeriod = (pilotFacet?.postedIds || []).map((x) => x._id?.toString()).filter(Boolean)
const acceptedInPeriod = (pilotFacet?.acceptedIds || []).map((x) => x._id?.toString()).filter(Boolean)
const createdInPeriod = await User.find({ role: 'user', createdAt: { $gte: startEff, $lte: end } }, { _id: 1 }).lean()
const allActiveIds = [...new Set([...postedInPeriod, ...acceptedInPeriod, ...createdInPeriod.map((u) => u._id.toString())])]
const wau = allActiveIds.length

const tasksPostedThisWeek = pilotFacet?.tasksPosted?.[0]?.count ?? 0
const completedInPeriod = pilotFacet?.completed?.[0]?.count ?? 0
const cancelledInPeriod = pilotFacet?.cancelled?.[0]?.count ?? 0
const closedCount = completedInPeriod + cancelledInPeriod
const taskCompletionRate = closedCount > 0 ? Math.round((completedInPeriod / closedCount) * 100) : 0

const acceptGroup = pilotFacet?.acceptTimes?.[0]
let avgTimeToAcceptHours = 0
if (acceptGroup && acceptGroup.count > 0 && acceptGroup.avgMs != null) {
  avgTimeToAcceptHours = Math.round((acceptGroup.avgMs / 3600000) * 10) / 10
}

const repeatUsers = pilotFacet?.repeatUsers?.[0]?.count ?? 0
const repeatUserRate = wau > 0 ? Math.round((repeatUsers / wau) * 100) : 0

const newUsersInPeriod = await User.countDocuments({ role: 'user', createdAt: { $gte: startEff, $lte: end } })
const newUsersPerDay = Math.round((newUsersInPeriod / 7) * 10) / 10

// ---- Weekly growth: single aggregation with $facet for 4 weeks ----
const weekBounds = []
for (let w = 1; w <= 4; w++) {
  const ws = new Date(now)
  ws.setDate(ws.getDate() - 7 * w)
  ws.setHours(0, 0, 0, 0)
  const we = new Date(ws)
  we.setDate(we.getDate() + 7)
  we.setMilliseconds(-1)
  weekBounds.push({ weekIndex: w, wsEff: effStart(ws), we })
}
const [week1, week2, week3, week4] = await Promise.all(weekBounds.map(({ wsEff, we }) => {
  if (wsEff > we) return Promise.resolve({ users: 0, tasksPosted: 0, tasksCompleted: 0 })
  return Promise.all([
    User.countDocuments({ role: 'user', createdAt: { $gte: wsEff, $lte: we } }),
    Task.countDocuments({ createdAt: { $gte: wsEff, $lte: we } }),
    Task.countDocuments({ status: 'COMPLETED', completedAt: { $gte: wsEff, $lte: we } })
  ]).then(([users, posted, completed]) => ({ users, tasksPosted: posted, tasksCompleted: completed }))
}))
const weeklyGrowth = [
  { weekLabel: 'Week 1', weekIndex: 1, ...week1 },
  { weekLabel: 'Week 2', weekIndex: 2, ...week2 },
  { weekLabel: 'Week 3', weekIndex: 3, ...week3 },
  { weekLabel: 'Week 4', weekIndex: 4, ...week4 }
]

const categories = (pilotFacet?.categories || []).map(({ _id, count }) => ({ name: _id || 'Other', count }))

// ---- User type: posters vs doers (in period) ----
const postersSet = new Set(postedInPeriod.map((id) => id.toString()))
const doersSet = new Set(acceptedInPeriod.filter(Boolean).map((id) => id.toString()))
const posters = postersSet.size
const doers = doersSet.size

// ---- Alerts ----
const alerts = []
if (taskCompletionRate < 60 && closedCount > 0) {
  alerts.push({ type: 'completion_low', message: `Task completion rate is ${taskCompletionRate}% (target >70%)`, severity: 'high' })
}
const tasksLast24h = await Task.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 3600000) } })
if (tasksLast24h === 0) {
  alerts.push({ type: 'no_tasks_24h', message: 'No tasks posted in the last 24 hours', severity: 'high' })
}
const acceptedInPeriodCount = pilotFacet?.acceptedInPeriodCount?.[0]?.count ?? 0
const topDoersTasks = pilotFacet?.topDoersSum?.[0]?.total ?? 0
if (doers > 0 && acceptedInPeriodCount > 0 && topDoersTasks >= acceptedInPeriodCount * 0.8) {
  alerts.push({ type: 'same_doers', message: 'Most tasks completed by same few doers (diversify worker base)', severity: 'medium' })
}
if (wau < 100 && weekNum === 1) {
  alerts.push({ type: 'wau_low', message: `WAU is ${wau} (target 100+)`, severity: 'medium' })
}
if (tasksPostedThisWeek < 21 && weekNum === 1) {
  const perDay = (tasksPostedThisWeek / 7).toFixed(1)
  if (parseFloat(perDay) < 3) {
    alerts.push({ type: 'tasks_per_day', message: `Tasks posted ~${perDay}/day (target 3–5/day)`, severity: 'medium' })
  }
}

// ---- Health score 0–100: completion 40%, growth 30%, satisfaction 30% ----
const completionScore = Math.min(100, Math.round((taskCompletionRate / 70) * 40))
const growthScore = (() => {
  const lastWeek = weeklyGrowth[weeklyGrowth.length - 1]
  const prevWeek = weeklyGrowth[weeklyGrowth.length - 2]
  if (!lastWeek || !prevWeek) return 30
  const growth = lastWeek.tasksPosted + lastWeek.tasksCompleted - (prevWeek.tasksPosted + prevWeek.tasksCompleted)
  return Math.min(30, Math.max(0, 15 + Math.round(growth * 2)))
})()
const ratedInPeriod = await Task.countDocuments({ status: 'COMPLETED', completedAt: { $gte: start, $lte: end }, rating: { $exists: true, $gte: 1 } })
const completedTotal = await Task.countDocuments({ status: 'COMPLETED', completedAt: { $gte: start, $lte: end } })
const satisfactionScore = completedTotal > 0 ? Math.min(30, Math.round((ratedInPeriod / completedTotal) * 30)) : 10
const healthScore = Math.min(100, Math.round(completionScore + growthScore + satisfactionScore))

res.json({
  week: weekNum,
  periodStart: start,
  periodEnd: end,
  pilotStartDate: pilotStartDate ? pilotStartDate.toISOString().slice(0, 10) : null,
  metrics: {
    wau,
    wauTarget: 100,
    tasksPostedThisWeek,
    tasksPerDayTarget: { min: 3, max: 5 },
    taskCompletionRate,
    completionTarget: 70,
    avgTimeToAcceptHours,
    avgTimeToAcceptTarget: 2,
    repeatUserRate,
    repeatUserTarget: 40,
    newUsersThisWeek: newUsersInPeriod,
    newUsersPerDay
  },
  weeklyGrowth,
  categories,
  userType: { posters, doers },
  alerts,
  healthScore,
  lastUpdated: new Date()
})
  } catch (error) {
  res.status(500).json({
    error: 'Server error',
    message: error.message || 'Failed to fetch pilot dashboard'
  })
}
}

// PUT /api/admin/pilot-dashboard/start-date - Set pilot start date (body: { pilotStartDate: "YYYY-MM-DD" }). Only data on or after this date is included.
const setPilotStartDate = async (req, res) => {
  try {
    const { pilotStartDate } = req.body
    if (pilotStartDate === undefined || pilotStartDate === null) {
      return res.status(400).json({ error: 'Missing pilotStartDate', message: 'pilotStartDate is required (YYYY-MM-DD or null to clear)' })
    }
    let value = null
    if (pilotStartDate !== '') {
      const str = String(pilotStartDate).trim()
      const d = new Date(str)
      if (isNaN(d.getTime())) {
        return res.status(400).json({ error: 'Invalid date', message: 'pilotStartDate must be YYYY-MM-DD or empty to clear' })
      }
      value = d.toISOString().slice(0, 10)
    }
    await Config.findOneAndUpdate(
      { key: 'pilotStartDate' },
      {
        $set: {
          value,
          description: 'Pilot start date: only data on or after this date is included in pilot dashboard metrics.',
          updatedAt: new Date(),
          updatedBy: req.user?._id
        }
      },
      { upsert: true, new: true }
    )
    invalidatePilotDashboard()
    res.json({ message: 'Pilot start date updated', pilotStartDate: value })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to update pilot start date'
    })
  }
}

const getStats = async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Total users
    const totalUsers = await User.countDocuments({ role: 'user' })

    // Online workers - use actual Socket.IO tracking
    const socketManager = require('../socket/socketManager')
    const onlineWorkersCount = socketManager.getOnlineWorkerCount()

    // Tasks today
    const tasksToday = await Task.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    })

    // Completed today
    const completedToday = await Task.countDocuments({
      status: 'COMPLETED',
      completedAt: { $gte: today, $lt: tomorrow }
    })

    // Cancelled today
    const cancelledToday = await Task.countDocuments({
      status: { $in: ['CANCELLED', 'CANCELLED_BY_ADMIN'] },
      createdAt: { $gte: today, $lt: tomorrow }
    })

    // Total earnings today (sum of completed task budgets today)
    const completedTasksToday = await Task.find({
      status: 'COMPLETED',
      completedAt: { $gte: today, $lt: tomorrow }
    }).select('budget')

    const earningsToday = completedTasksToday.reduce((sum, task) => sum + (task.budget || 0), 0)

    // Get abuse metrics
    const abuseMetrics = await getAbuseMetrics()

    res.json({
      totalUsers,
      onlineWorkers: onlineWorkersCount,
      tasksToday,
      completedToday,
      cancelledToday,
      earningsToday,
      abuseMetrics
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to fetch admin stats'
    })
  }
}

// ============================================
// WORKERS MANAGEMENT
// ============================================

// GET /api/admin/workers - List workers (users who accepted ≥1 task) with stats + online status
// Single aggregation instead of N+1 per-worker queries
const getWorkers = async (req, res) => {
  try {
    const socketManager = require('../socket/socketManager')
    const onlineWorkerIds = new Set(socketManager.getOnlineWorkers())
    const workersWithLocations = socketManager.getAllWorkersWithLocations()

    const workerStats = await Task.aggregate([
      { $match: { acceptedBy: { $ne: null } } },
      {
        $group: {
          _id: '$acceptedBy',
          tasksAccepted: { $sum: 1 },
          tasksCompleted: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
          totalEarnings: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, '$budget', 0] } },
          sumRating: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'COMPLETED'] }, { $ne: ['$rating', null] }] }, '$rating', 0] } },
          countRated: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'COMPLETED'] }, { $ne: ['$rating', null] }] }, 1, 0] } }
        }
      },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user', pipeline: [{ $project: { name: 1, email: 1, phone: 1, averageRating: 1 } }] } },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          name: '$user.name',
          email: '$user.email',
          phone: '$user.phone',
          averageRating: '$user.averageRating',
          tasksAccepted: 1,
          tasksCompleted: 1,
          totalEarnings: 1,
          completionRate: { $cond: [{ $eq: ['$tasksAccepted', 0] }, 0, { $round: [{ $multiply: [{ $divide: ['$tasksCompleted', '$tasksAccepted'] }, 100] }, 0] }] },
          avgRating: { $cond: [{ $eq: ['$countRated', 0] }, null, { $round: [{ $divide: ['$sumRating', '$countRated'] }, 1] }] },
          totalRatings: '$countRated'
        }
      }
    ]).then(arr => arr.map((w) => ({
      _id: w._id,
      name: w.name,
      email: w.email,
      phone: w.phone,
      averageRating: w.avgRating ?? w.averageRating ?? null,
      tasksAccepted: w.tasksAccepted,
      tasksCompleted: w.tasksCompleted,
      completionRate: w.completionRate,
      totalEarnings: w.totalEarnings,
      totalRatings: w.totalRatings || 0
    })))

    const workersWithStats = workerStats.map((w) => {
      const id = w._id.toString()
      const loc = workersWithLocations.find((x) => x.userId === id)
      return {
        ...w,
        isOnline: onlineWorkerIds.has(id),
        location: loc?.location || null
      }
    })

    res.json({
      workers: workersWithStats,
      onlineCount: onlineWorkerIds.size
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to fetch workers'
    })
  }
}

// ============================================
// CHAT MONITORING
// ============================================

// GET /api/admin/chats - List all chat rooms (by task, paginated)
const getChats = async (req, res) => {
  try {
    const { taskId, userId } = req.query
    const query = {}
    if (taskId) query.taskId = taskId
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.participants = userId
    }
    const { page, limit, skip } = parsePagination(req.query)
    const [chats, total] = await Promise.all([
      Chat.find(query)
        .populate('taskId', 'title status postedBy acceptedBy')
        .populate('participants', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Chat.countDocuments(query)
    ])
    res.json({
      chats,
      pagination: paginationMeta(page, limit, total, chats.length)
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to fetch chats'
    })
  }
}

// GET /api/admin/chats/:taskId - Get chat messages for a task
const getChatByTaskId = async (req, res) => {
  try {
    const { taskId } = req.params
    const chat = await Chat.findOne({ taskId })
      .populate('taskId', 'title status postedBy acceptedBy')
      .populate('participants', 'name email phone')
      .lean()
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found', message: 'No chat for this task' })
    }
    const senderIds = [...new Set((chat.messages || []).map((m) => m.senderId?.toString()))]
    const senders = await User.find({ _id: { $in: senderIds } }).select('name email phone').lean()
    const senderMap = {}
    senders.forEach((s) => { senderMap[s._id.toString()] = s })
    const messagesWithSender = (chat.messages || []).map((m) => ({
      ...m,
      sender: senderMap[m.senderId?.toString()] || null
    }))
    res.json({
      chat: { ...chat, messages: messagesWithSender }
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to fetch chat'
    })
  }
}

// ============================================
// SETTINGS (Config)
// ============================================

// GET /api/admin/settings - Get all config keys
const getSettings = async (req, res) => {
  try {
    const configs = await Config.find().sort({ key: 1 }).lean()
    const map = {}
    configs.forEach((c) => { map[c.key] = c.value })
    res.json({ settings: map, list: configs })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to fetch settings'
    })
  }
}

// PUT /api/admin/settings - Update config (body: { key, value, description? })
const updateSettings = async (req, res) => {
  try {
    const { key, value, description } = req.body
    if (!key) {
      return res.status(400).json({ error: 'Missing key', message: 'key is required' })
    }
    const keyStr = String(key).trim()
    const updated = await Config.findOneAndUpdate(
      { key: keyStr },
      {
        $set: {
          value: value !== undefined ? value : null,
          ...(description !== undefined && { description: String(description).trim() }),
          updatedAt: new Date(),
          updatedBy: req.user?._id
        }
      },
      { upsert: true, new: true }
    )
    invalidateSettingsKeys(keyStr)
    res.json({ message: 'Settings updated', setting: updated })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to update settings'
    })
  }
}

// ============================================
// REVIEWS & RATINGS
// ============================================

// GET /api/admin/reviews - List all ratings/reviews (from completed tasks)
const getReviews = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query)
    const reviewFields = 'rating ratedAt review postedBy acceptedBy'
    const query = { rating: { $exists: true, $ne: null } }
    const [tasks, total] = await Promise.all([
      Task.find(query)
        .select(reviewFields)
        .populate('postedBy', 'name email phone')
        .populate('acceptedBy', 'name email phone')
        .sort({ ratedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Task.countDocuments(query)
    ])
    res.json({
      reviews: tasks,
      pagination: paginationMeta(page, limit, total, tasks.length)
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to fetch reviews'
    })
  }
}

// ============================================
// LOGS
// ============================================

// GET /api/admin/logs - Admin action logs + optional filter
const getLogs = async (req, res) => {
  try {
    const { resource, adminId } = req.query
    const { page, limit, skip } = parsePagination(req.query)
    const query = {}
    if (resource) query.resource = resource
    if (adminId) query.adminId = adminId
    const [logs, total] = await Promise.all([
      AdminLog.find(query)
        .populate('adminId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AdminLog.countDocuments(query)
    ])
    res.json({
      logs,
      pagination: paginationMeta(page, limit, total, logs.length)
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to fetch logs'
    })
  }
}

// ============================================
// ANALYTICS
// ============================================

// GET /api/admin/analytics - Top posters, top workers, best areas, funnel (cached 60s)
// Single $facet for all Task-derived analytics; early $match on indexed fields; tight $lookup projection
const getAnalytics = async (req, res) => {
  try {
    const [analyticsFacet] = await Task.aggregate([
      {
        $facet: {
          topPosters: [
            { $match: { status: 'COMPLETED' } },
            { $group: { _id: '$postedBy', totalSpent: { $sum: '$budget' }, count: { $sum: 1 } } },
            { $sort: { totalSpent: -1 } },
            { $limit: 20 },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user', pipeline: [{ $project: { name: 1, email: 1 } }] } },
            { $unwind: '$user' },
            { $project: { userId: '$_id', name: '$user.name', email: '$user.email', totalSpent: 1, count: 1, _id: 0 } }
          ],
          topWorkers: [
            { $match: { status: 'COMPLETED', acceptedBy: { $ne: null } } },
            { $group: { _id: '$acceptedBy', totalEarnings: { $sum: '$budget' }, count: { $sum: 1 } } },
            { $sort: { totalEarnings: -1 } },
            { $limit: 20 },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user', pipeline: [{ $project: { name: 1, email: 1 } }] } },
            { $unwind: '$user' },
            { $project: { userId: '$_id', name: '$user.name', email: '$user.email', totalEarnings: 1, count: 1, _id: 0 } }
          ],
          bestAreas: [
            { $match: { 'location.city': { $exists: true, $ne: null, $ne: '' } } },
            { $group: { _id: '$location.city', taskCount: { $sum: 1 }, revenue: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, '$budget', 0] } } } },
            { $sort: { taskCount: -1 } },
            { $limit: 15 }
          ],
          funnel: [{ $group: { _id: '$status', count: { $sum: 1 } } }]
        }
      }
    ])

    const topPosters = analyticsFacet?.topPosters || []
    const topWorkers = analyticsFacet?.topWorkers || []
    const bestAreas = (analyticsFacet?.bestAreas || []).map(({ _id, taskCount, revenue }) => ({ city: _id, taskCount, revenue }))
    const funnel = analyticsFacet?.funnel || []
    const posted = funnel.filter((f) => ['OPEN', 'SEARCHING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'CANCELLED_BY_POSTER', 'CANCELLED_BY_WORKER', 'CANCELLED_BY_ADMIN'].includes(f._id)).reduce((s, f) => s + f.count, 0)
    const accepted = (funnel.find((f) => f._id === 'ACCEPTED')?.count || 0) + (funnel.find((f) => f._id === 'IN_PROGRESS')?.count || 0) + (funnel.find((f) => f._id === 'COMPLETED')?.count || 0)
    const completed = funnel.find((f) => f._id === 'COMPLETED')?.count || 0
    const cancelled = (funnel.find((f) => f._id === 'CANCELLED')?.count || 0) + (funnel.find((f) => f._id === 'CANCELLED_BY_POSTER')?.count || 0) + (funnel.find((f) => f._id === 'CANCELLED_BY_WORKER')?.count || 0) + (funnel.find((f) => f._id === 'CANCELLED_BY_ADMIN')?.count || 0)

    res.json({
      topPosters,
      topWorkers,
      bestAreas,
      funnel: {
        posted,
        accepted,
        completed,
        cancelled
      }
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to fetch analytics'
    })
  }
}

// GET /api/admin/feedback - List onboarding feedback and profile feedback (college pilot)
const getFeedback = async (req, res) => {
  try {
    const [profileFeedback, usersWithOnboarding] = await Promise.all([
      UserFeedback.find()
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .lean(),
      User.find(
        { 'onboardingFeedback.submittedAt': { $exists: true, $ne: null } },
        'name email phone onboardingFeedback'
      )
        .sort({ 'onboardingFeedback.submittedAt': -1 })
        .lean()
    ])
    const onboardingFeedback = usersWithOnboarding
      .filter(u => u.onboardingFeedback?.submittedAt)
      .map(u => ({
        userId: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        useCase: u.onboardingFeedback?.useCase || '',
        suggestions: u.onboardingFeedback?.suggestions || '',
        submittedAt: u.onboardingFeedback?.submittedAt
      }))
    return res.status(200).json({
      profileFeedback: profileFeedback.map(f => ({
        _id: f._id,
        user: f.user ? { _id: f.user._id, name: f.user.name, email: f.user.email, phone: f.user.phone } : null,
        rating: f.rating,
        text: f.text,
        createdAt: f.createdAt
      })),
      onboardingFeedback
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to fetch feedback'
    })
  }
}

module.exports = {
  // Public stats
  getPublicStats,
  // User management
  getUsers,
  getUserById,
  updateUser,
  blockUser,
  unblockUser,
  banUser,
  resetCancellations,
  updateCancelLimit,
  // Task moderation
  getTasks,
  getTaskById,
  cancelTask,
  unassignTask,
  hideTask,
  // Reports
  getReports,
  resolveReport,
  // Stats
  getStats,
  getDashboard,
  getDashboardCharts,
  getPilotDashboard,
  setPilotStartDate,
  // Workers
  getWorkers,
  // Chats
  getChats,
  getChatByTaskId,
  // Settings
  getSettings,
  updateSettings,
  // Reviews
  getReviews,
  // Feedback (onboarding + profile)
  getFeedback,
  // Logs
  getLogs,
  // Analytics
  getAnalytics
}

