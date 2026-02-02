const express = require('express')
const router = express.Router()
const { authenticate } = require('../middleware/auth')
const { createTask, acceptTask, getAvailableTasks, getTaskById, getTasksByUser, cancelTask, startTask, markComplete, confirmComplete, rateTask, editTask, deleteTask, duplicateTask, bulkCancelTasks, bulkExtendValidity, bulkDeleteTasks, getPosterTaskAnalytics, setRecurringSchedule } = require('../controllers/taskController')
const { getMessages, sendMessage } = require('../controllers/chatController')
const { getPublicStats } = require('../controllers/adminController')

// Test route to verify router is working
router.get('/test', (req, res) => {
  res.json({ message: 'Task routes are working!' })
})

// GET /api/stats - Get public stats (no auth required)
router.get('/stats', getPublicStats)

// GET /api/tasks/user/:userId - Fetch tasks posted by a user (MUST come before /tasks/:taskId)
router.get('/tasks/user/:userId', getTasksByUser)

// GET /api/tasks/user/:userId/analytics - Poster task analytics
router.get('/tasks/user/:userId/analytics', getPosterTaskAnalytics)

// POST /api/tasks/bulk-cancel, bulk-extend-validity, bulk-delete (MUST come before /tasks/:taskId)
router.post('/tasks/bulk-cancel', bulkCancelTasks)
router.post('/tasks/bulk-extend-validity', bulkExtendValidity)
router.post('/tasks/bulk-delete', bulkDeleteTasks)

// GET /api/tasks/:taskId - Fetch single task by ID (MUST come before /tasks to avoid route conflict)
router.get('/tasks/:taskId', getTaskById)

// Chat (task-based; auth required)
router.get('/tasks/:taskId/chat', authenticate, getMessages)
router.post('/tasks/:taskId/chat', authenticate, sendMessage)

// GET /api/tasks - Fetch available tasks
router.get('/tasks', getAvailableTasks)

// POST /api/tasks/:taskId/cancel - Cancel a task
router.post('/tasks/:taskId/cancel', cancelTask)

// POST /api/tasks/:taskId/start - Worker starts task (ACCEPTED → IN_PROGRESS)
router.post('/tasks/:taskId/start', startTask)

// POST /api/tasks/:taskId/mark-complete - Worker marks task as complete
router.post('/tasks/:taskId/mark-complete', markComplete)

// POST /api/tasks/:taskId/confirm-complete - Poster confirms completion
router.post('/tasks/:taskId/confirm-complete', confirmComplete)

// POST /api/tasks/:taskId/rate - Poster rates worker after completion
router.post('/tasks/:taskId/rate', rateTask)

// PUT /api/tasks/:taskId/edit - Poster edits their task
router.put('/tasks/:taskId/edit', editTask)

// PATCH /api/tasks/:taskId/recurring - Poster set recurring schedule / pause
router.patch('/tasks/:taskId/recurring', setRecurringSchedule)

// DELETE /api/tasks/:taskId - Poster deletes their task
router.delete('/tasks/:taskId', deleteTask)

// POST /api/tasks/:taskId/accept (MUST come before /tasks to avoid route conflict)
router.post('/tasks/:taskId/accept', acceptTask)

// POST /api/tasks/:taskId/duplicate - Poster duplicates task
router.post('/tasks/:taskId/duplicate', duplicateTask)

// POST /api/tasks - Create new task
router.post('/tasks', createTask)

module.exports = router

