const Chat = require('../models/Chat')
const Task = require('../models/Task')
const mongoose = require('mongoose')
const { emitReceiveMessage } = require('../socket/socketHandler')

const ALLOW_READ_STATUSES = ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED']
const ALLOW_SEND_STATUSES = ['ACCEPTED', 'IN_PROGRESS']

/**
 * Validate: task exists, user is participant, task status allows the operation.
 * @param {string} taskId
 * @param {string} userId
 * @param {string[]} allowedStatuses - e.g. ALLOW_READ_STATUSES or ALLOW_SEND_STATUSES
 * @returns {{ task, chat, errorResponse } | { task, chat } }
 */
async function validateChatAccess(taskId, userId, allowedStatuses) {
  if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(userId)) {
    return { errorResponse: { status: 400, body: { error: 'Invalid ID', message: 'Invalid task or user ID' } } }
  }

  const task = await Task.findById(taskId).select('status postedBy acceptedBy')
  if (!task) {
    return { errorResponse: { status: 404, body: { error: 'Task not found', message: 'Task does not exist' } } }
  }

  if (!allowedStatuses.includes(task.status)) {
    return {
      errorResponse: {
        status: 403,
        body: {
          error: 'Chat not available',
          message: task.status === 'COMPLETED'
            ? 'Task is completed. Chat is read-only.'
            : 'Chat is not available for this task.'
        }
      }
    }
  }

  const posterId = task.postedBy?.toString()
  const workerId = task.acceptedBy?.toString()
  const userIdStr = userId.toString()
  const isParticipant = posterId === userIdStr || workerId === userIdStr

  if (!isParticipant) {
    return { errorResponse: { status: 403, body: { error: 'Forbidden', message: 'Only task participants can access this chat' } } }
  }

  const chat = await Chat.findOne({ taskId }).lean()
  if (!chat) {
    return { errorResponse: { status: 404, body: { error: 'Chat not found', message: 'Chat is not available yet' } } }
  }

  return { task, chat }
}

/**
 * GET /api/tasks/:taskId/chat - Fetch messages (read when ACCEPTED, IN_PROGRESS, or COMPLETED)
 */
const getMessages = async (req, res) => {
  try {
    const { taskId } = req.params
    const userId = req.userId

    const result = await validateChatAccess(taskId, userId, ALLOW_READ_STATUSES)
    if (result.errorResponse) {
      return res.status(result.errorResponse.status).json(result.errorResponse.body)
    }

    const { chat } = result
    const messages = (chat.messages || []).map((m) => ({
      _id: m._id,
      senderId: m.senderId?.toString?.() || m.senderId,
      text: m.text,
      createdAt: m.createdAt
    }))

    return res.json({
      taskId,
      messages,
      isReadOnly: !ALLOW_SEND_STATUSES.includes(result.task.status)
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to fetch messages'
    })
  }
}

/**
 * POST /api/tasks/:taskId/chat - Send message (only when ACCEPTED or IN_PROGRESS)
 */
const sendMessage = async (req, res) => {
  try {
    const { taskId } = req.params
    const userId = req.userId
    const { text } = req.body || {}

    const trimmed = typeof text === 'string' ? text.trim() : ''
    if (!trimmed) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Message text is required and cannot be empty'
      })
    }

    if (trimmed.length > 2000) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Message must be at most 2000 characters'
      })
    }

    const result = await validateChatAccess(taskId, userId, ALLOW_SEND_STATUSES)
    if (result.errorResponse) {
      return res.status(result.errorResponse.status).json(result.errorResponse.body)
    }

    const { chat } = result
    const message = {
      _id: new mongoose.Types.ObjectId(),
      senderId: new mongoose.Types.ObjectId(userId),
      text: trimmed,
      createdAt: new Date()
    }

    await Chat.updateOne(
      { taskId },
      { $push: { messages: message } }
    )

    const payload = {
      taskId,
      message: {
        _id: message._id,
        senderId: userId,
        text: message.text,
        createdAt: message.createdAt
      }
    }

    emitReceiveMessage(taskId, payload.message)

    return res.status(201).json({
      message: 'Message sent',
      data: payload.message
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to send message'
    })
  }
}

module.exports = {
  getMessages,
  sendMessage
}
