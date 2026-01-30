const express = require('express')
const router = express.Router()
const { authenticate } = require('../middleware/auth')
const { adminMiddleware } = require('../middleware/admin')
const {
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
  getStats,
  getDashboard
} = require('../controllers/adminController')

// All admin routes require authentication AND admin role
// Apply both middlewares to all routes
router.use(authenticate)
router.use(adminMiddleware)

// ============================================
// ADMIN USER MANAGEMENT ROUTES
// ============================================

// GET /api/admin/users - List all users with filters
router.get('/users', getUsers)

// GET /api/admin/users/:userId - Get user details
router.get('/users/:userId', getUserById)

// PATCH /api/admin/users/:userId/block - Block user
router.patch('/users/:userId/block', blockUser)

// PATCH /api/admin/users/:userId/unblock - Unblock user
router.patch('/users/:userId/unblock', unblockUser)

// PATCH /api/admin/users/:userId/ban - Ban user
router.patch('/users/:userId/ban', banUser)

// PATCH /api/admin/users/:userId/reset-cancellations - Reset daily cancellation count
router.patch('/users/:userId/reset-cancellations', resetCancellations)

// PATCH /api/admin/users/:userId/update-cancel-limit - Update user's cancellation limit
router.patch('/users/:userId/update-cancel-limit', updateCancelLimit)

// ============================================
// ADMIN TASK MODERATION ROUTES
// ============================================

// GET /api/admin/tasks - List all tasks with filters
router.get('/tasks', getTasks)

// GET /api/admin/tasks/:taskId - Get task details
router.get('/tasks/:taskId', getTaskById)

// PATCH /api/admin/tasks/:taskId/cancel - Force cancel task
router.patch('/tasks/:taskId/cancel', cancelTask)

// PATCH /api/admin/tasks/:taskId/unassign - Remove worker from task
router.patch('/tasks/:taskId/unassign', unassignTask)

// PATCH /api/admin/tasks/:taskId/hide - Hide task from public listings
router.patch('/tasks/:taskId/hide', hideTask)

// ============================================
// ADMIN REPORTS ROUTES
// ============================================

// GET /api/admin/reports - List all reports
router.get('/reports', getReports)

// PATCH /api/admin/reports/:id/resolve - Resolve report
router.patch('/reports/:id/resolve', resolveReport)

// ============================================
// ADMIN STATS ROUTES
// ============================================

// GET /api/admin/stats - Get admin dashboard stats (legacy overview cards)
router.get('/stats', getStats)

// GET /api/admin/dashboard - Full dashboard (tasks by status/location/category, revenue, users, recent activity)
router.get('/dashboard', getDashboard)

module.exports = router

