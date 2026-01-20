const User = require('../models/User')
const Task = require('../models/Task')
const Report = require('../models/Report')
const mongoose = require('mongoose')
const { notifyUserUpdated, notifyTaskUpdated, notifyTaskCancelled, notifyAdminStatsRefresh } = require('../socket/socketHandler')

// ============================================
// ADMIN USER MANAGEMENT
// ============================================

// GET /api/admin/users - List all users with filters and pagination
const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      role,
      status,
      highCancellation = false
    } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

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

    // Fetch users
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)

    // Get user stats
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const tasksPosted = await Task.countDocuments({ postedBy: user._id })
        const tasksAccepted = await Task.countDocuments({ acceptedBy: user._id })
        const tasksCompleted = await Task.countDocuments({
          acceptedBy: user._id,
          status: 'COMPLETED'
        })
        const tasksCancelled = await Task.countDocuments({
          $or: [
            { postedBy: user._id, status: 'CANCELLED' },
            { acceptedBy: user._id, status: 'CANCELLED' }
          ]
        })

        return {
          ...user.toObject(),
          stats: {
            tasksPosted,
            tasksAccepted,
            tasksCompleted,
            tasksCancelled,
            averageRating: user.averageRating || 0
          }
        }
      })
    )

    // Total count for pagination
    const total = await User.countDocuments(query)

    res.json({
      users: usersWithStats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
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

    const user = await User.findById(userId).select('-password')
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User does not exist'
      })
    }

    // Ensure dailyCancelCount and totalCancelLimit are included and properly set
    const userObject = user.toObject()
    if (userObject.dailyCancelCount === undefined || userObject.dailyCancelCount === null) {
      userObject.dailyCancelCount = 0
    }
    if (userObject.totalCancelLimit === undefined || userObject.totalCancelLimit === null) {
      userObject.totalCancelLimit = 2 // Default to 2 if not set
    }

    // Get user activity
    const tasksPosted = await Task.find({ postedBy: userId })
      .select('title status budget createdAt')
      .sort({ createdAt: -1 })
      .limit(50)

    const tasksAccepted = await Task.find({ acceptedBy: userId })
      .select('title status budget createdAt')
      .sort({ createdAt: -1 })
      .limit(50)

    const cancellationHistory = await Task.find({
      $or: [
        { postedBy: userId, status: { $in: ['CANCELLED', 'CANCELLED_BY_ADMIN'] } },
        { acceptedBy: userId, status: { $in: ['CANCELLED', 'CANCELLED_BY_ADMIN'] } }
      ]
    })
      .select('title status createdAt')
      .sort({ createdAt: -1 })
      .limit(50)

    // Get ratings received (for workers)
    const ratingsReceived = await Task.find({
      acceptedBy: userId,
      rating: { $exists: true, $ne: null }
    })
      .select('rating review ratedAt')
      .sort({ ratedAt: -1 })

    res.json({
      user: userObject,
      activity: {
        tasksPosted,
        tasksAccepted,
        cancellationHistory,
        ratingsReceived
      }
    })
  } catch (error) {
    console.error('Error fetching user details:', error)
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to fetch user details'
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

    // Notify user via socket
    notifyUserUpdated(userId, { status: 'blocked' })
    
    // Notify admin stats refresh
    notifyAdminStatsRefresh()

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
    console.error('Error blocking user:', error)
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

    // Notify user via socket
    notifyUserUpdated(userId, { status: 'active' })
    
    // Notify admin stats refresh
    notifyAdminStatsRefresh()

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
    console.error('Error unblocking user:', error)
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

    // Notify user via socket
    notifyUserUpdated(userId, { status: 'banned' })
    
    // Notify admin stats refresh
    notifyAdminStatsRefresh()

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
    console.error('Error banning user:', error)
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
    
    // Notify admin stats refresh
    notifyAdminStatsRefresh()
    
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
    console.error('Error resetting cancellations:', error)
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
    
    // Notify user via socket
    notifyUserUpdated(userId, { totalCancelLimit: limitNum })
    
    // Notify admin stats refresh
    notifyAdminStatsRefresh()
    
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
    console.error('Error updating cancellation limit:', error)
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
    const {
      page = 1,
      limit = 20,
      status,
      category,
      city,
      minBudget,
      maxBudget,
      reportedOnly = false
    } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

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

    // Fetch tasks
    const tasks = await Task.find(query)
      .populate('postedBy', 'name email phone')
      .populate('acceptedBy', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)

    // Total count for pagination
    const total = await Task.countDocuments(query)

    res.json({
      tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
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

    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
        message: 'Task does not exist'
      })
    }

    // Get status timeline (simplified - can be enhanced)
    const timeline = []
    if (task.createdAt) {
      timeline.push({ event: 'Task Posted', timestamp: task.createdAt })
    }
    if (task.acceptedBy) {
      const acceptedTask = await Task.findOne({ _id: taskId, status: 'ACCEPTED' })
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

    res.json({
      task: task.toObject(),
      timeline
    })
  } catch (error) {
    console.error('Error fetching task details:', error)
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

    // Notify poster and worker via Socket.IO
    if (task.postedBy) {
      notifyTaskCancelled(task.postedBy.toString(), task._id.toString(), 'admin')
    }
    if (task.acceptedBy) {
      notifyTaskCancelled(task.acceptedBy.toString(), task._id.toString(), 'admin')
    }
    notifyTaskUpdated(task._id.toString(), { status: 'CANCELLED_BY_ADMIN', postedBy: task.postedBy, acceptedBy: task.acceptedBy })
    
    // Notify admin stats refresh
    notifyAdminStatsRefresh()

    res.json({
      message: 'Task cancelled by admin',
      task: {
        _id: task._id,
        title: task.title,
        status: task.status
      }
    })
  } catch (error) {
    console.error('Error cancelling task:', error)
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

    // Notify worker and poster via Socket.IO
    if (previousWorkerId) {
      notifyTaskUpdated(task._id.toString(), { status: 'SEARCHING', acceptedBy: null, postedBy: task.postedBy })
    }
    
    // Notify admin stats refresh
    notifyAdminStatsRefresh()

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
    console.error('Error unassigning task:', error)
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

    // Toggle hide task
    task.isHidden = !task.isHidden
    await task.save()

    res.json({
      message: task.isHidden ? 'Task hidden successfully' : 'Task made visible',
      task: {
        _id: task._id,
        title: task.title,
        isHidden: task.isHidden
      }
    })
  } catch (error) {
    console.error('Error hiding task:', error)
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
    const {
      page = 1,
      limit = 20,
      status = 'open',
      reason
    } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    const query = {}
    if (status) {
      query.status = status
    }
    if (reason) {
      query.reason = reason
    }

    const reports = await Report.find(query)
      .populate('reporter', 'name email')
      .populate('reportedUser', 'name email status')
      .populate('reportedTask', 'title status')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)

    const total = await Report.countDocuments(query)

    res.json({
      reports,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
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
    console.error('Error resolving report:', error)
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
    }).select('rating')
    
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
    console.error('Error fetching public stats:', error)
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to fetch public stats'
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
    console.error('Error fetching admin stats:', error)
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to fetch admin stats'
    })
  }
}

module.exports = {
  // Public stats
  getPublicStats,
  // User management
  getUsers,
  getUserById,
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
  getStats
}

