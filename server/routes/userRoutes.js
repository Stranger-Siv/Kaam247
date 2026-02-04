const express = require('express')
const router = express.Router()
const { createUser, updateProfile, getActivity, getEarnings, getTransactions, getProfile, submitOnboardingFeedback, submitProfileFeedback, getCancellationStatus, getActiveTask, savePushSubscription, saveTaskTemplate, getTaskTemplates, deleteTaskTemplate, toggleSavedTask, getAvailabilitySchedule, updateAvailabilitySchedule } = require('../controllers/userController')
const { createTicket, getMyTickets, getMyTicketById, sendUserTicketMessage } = require('../controllers/supportTicketController')
const { authenticate } = require('../middleware/auth')

// POST /api/users - Create user (public)
router.post('/users', createUser)

// GET /api/users/me - Get current user profile (authenticated)
router.get('/users/me', authenticate, getProfile)

// POST /api/users/me/onboarding-feedback - Save onboarding feedback (authenticated)
router.post('/users/me/onboarding-feedback', authenticate, submitOnboardingFeedback)

// POST /api/users/me/feedback - Submit profile feedback & suggestions (authenticated)
router.post('/users/me/feedback', authenticate, submitProfileFeedback)

// PUT /api/users/me - Update current user profile (authenticated)
router.put('/users/me', authenticate, updateProfile)

// GET /api/users/me/activity - Get user activity history (authenticated; ?dateFrom= &dateTo= &export=csv)
router.get('/users/me/activity', authenticate, getActivity)

// POST /api/users/me/saved-tasks/:taskId - Toggle bookmark (authenticated)
router.post('/users/me/saved-tasks/:taskId', authenticate, toggleSavedTask)

// GET /api/users/me/availability-schedule - Get availability schedule (authenticated)
router.get('/users/me/availability-schedule', authenticate, getAvailabilitySchedule)

// PATCH /api/users/me/availability-schedule - Update availability schedule (authenticated)
router.patch('/users/me/availability-schedule', authenticate, updateAvailabilitySchedule)

// GET /api/users/me/earnings - Get worker earnings (authenticated)
router.get('/users/me/earnings', authenticate, getEarnings)

// GET /api/users/me/transactions - Get poster transactions / spend (authenticated)
router.get('/users/me/transactions', authenticate, getTransactions)

// GET /api/users/me/cancellation-status - Get worker cancellation status (authenticated)
router.get('/users/me/cancellation-status', authenticate, getCancellationStatus)

// GET /api/users/me/active-task - Check if user has active tasks (authenticated)
router.get('/users/me/active-task', authenticate, getActiveTask)

// POST /api/users/me/tickets - Create support ticket (e.g. phone change)
router.post('/users/me/tickets', authenticate, createTicket)

// GET /api/users/me/tickets - List current user's tickets
router.get('/users/me/tickets', authenticate, getMyTickets)

// GET /api/users/me/tickets/:ticketId - Get one ticket with messages (own only)
router.get('/users/me/tickets/:ticketId', authenticate, getMyTicketById)

// POST /api/users/me/tickets/:ticketId/messages - Send message (only when ticket ACCEPTED)
router.post('/users/me/tickets/:ticketId/messages', authenticate, sendUserTicketMessage)

// POST /api/users/me/push-subscription - Save FCM token for push notifications
router.post('/users/me/push-subscription', authenticate, savePushSubscription)

// POST /api/users/me/templates - Save a task template
router.post('/users/me/templates', authenticate, saveTaskTemplate)

// GET /api/users/me/templates - Get all task templates
router.get('/users/me/templates', authenticate, getTaskTemplates)

// DELETE /api/users/me/templates/:templateId - Delete a task template
router.delete('/users/me/templates/:templateId', authenticate, deleteTaskTemplate)

module.exports = router

