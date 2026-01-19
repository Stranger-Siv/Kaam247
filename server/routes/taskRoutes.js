const express = require('express')
const router = express.Router()
const { createTask, acceptTask, getAvailableTasks, getTaskById, getTasksByUser, cancelTask, startTask, markComplete, confirmComplete, rateTask, editTask, deleteTask } = require('../controllers/taskController')

// Test route to verify router is working
router.get('/test', (req, res) => {
  res.json({ message: 'Task routes are working!' })
})

// GET /api/tasks/user/:userId - Fetch tasks posted by a user (MUST come before /tasks/:taskId)
router.get('/tasks/user/:userId', getTasksByUser)

// GET /api/tasks/:taskId - Fetch single task by ID (MUST come before /tasks to avoid route conflict)
router.get('/tasks/:taskId', getTaskById)

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

// DELETE /api/tasks/:taskId - Poster deletes their task
router.delete('/tasks/:taskId', deleteTask)

// POST /api/tasks/:taskId/accept (MUST come before /tasks to avoid route conflict)
router.post('/tasks/:taskId/accept', acceptTask)

// POST /api/tasks - Create new task
router.post('/tasks', createTask)

module.exports = router

