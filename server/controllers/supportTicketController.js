const SupportTicket = require('../models/SupportTicket')
const User = require('../models/User')
const mongoose = require('mongoose')
const { emitTicketMessage } = require('../socket/socketHandler')

// POST /api/users/me/tickets - Create a support ticket (SUPPORT with subject+message, or MOBILE_UPDATE)
const createTicket = async (req, res) => {
  try {
    const userId = req.userId
    const { type = 'MOBILE_UPDATE', subject, message: initialMessage, requestedPhone, reason } = req.body

    if (type === 'SUPPORT') {
      const sub = (subject || '').trim().slice(0, 200)
      const msg = (initialMessage || '').trim().slice(0, 2000)
      if (!sub) {
        return res.status(400).json({ error: 'Validation error', message: 'Subject is required' })
      }
      if (!msg) {
        return res.status(400).json({ error: 'Validation error', message: 'Please describe your issue' })
      }
      const ticket = await SupportTicket.create({
        user: userId,
        type: 'SUPPORT',
        subject: sub,
        initialMessage: msg,
        status: 'OPEN'
      })
      const populated = await SupportTicket.findById(ticket._id).populate('user', 'name email phone').lean()
      return res.status(201).json({
        message: 'Support ticket created. An admin will accept it and start a chat with you shortly.',
        ticket: {
          _id: populated._id,
          type: populated.type,
          subject: populated.subject,
          initialMessage: populated.initialMessage,
          status: populated.status,
          createdAt: populated.createdAt
        }
      })
    }

    // MOBILE_UPDATE
    const digits = (requestedPhone || '').replace(/\D/g, '')
    if (digits.length !== 10) {
      return res.status(400).json({
        error: 'Invalid phone',
        message: 'Enter a valid 10-digit phone for the change request'
      })
    }
    const ticket = await SupportTicket.create({
      user: userId,
      type: 'MOBILE_UPDATE',
      requestedPhone: digits,
      reason: (reason || '').trim().slice(0, 500),
      status: 'PENDING'
    })
    const populated = await SupportTicket.findById(ticket._id).populate('user', 'name email phone').lean()
    return res.status(201).json({
      message: 'Request submitted. Admin will review and update your phone as soon as possible.',
      ticket: {
        _id: populated._id,
        type: populated.type,
        requestedPhone: populated.requestedPhone,
        reason: populated.reason,
        status: populated.status,
        createdAt: populated.createdAt
      }
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to create ticket'
    })
  }
}

// GET /api/users/me/tickets - List current user's tickets
const getMyTickets = async (req, res) => {
  try {
    const userId = req.userId
    const tickets = await SupportTicket.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean()

    return res.status(200).json({
      tickets
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to fetch tickets'
    })
  }
}

// GET /api/users/me/tickets/:ticketId - Get one ticket (own only) with messages
const getMyTicketById = async (req, res) => {
  try {
    const userId = req.userId
    const { ticketId } = req.params
    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID', message: 'Invalid ticket ID format' })
    }
    const ticket = await SupportTicket.findOne({ _id: ticketId, user: userId })
      .populate('user', 'name email phone')
      .populate('acceptedBy', 'name email')
      .lean()
    if (!ticket) {
      return res.status(404).json({ error: 'Not found', message: 'Ticket not found' })
    }
    return res.status(200).json({ ticket })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to fetch ticket'
    })
  }
}

// POST /api/users/me/tickets/:ticketId/messages - Send message (user; only when ACCEPTED)
const sendUserTicketMessage = async (req, res) => {
  try {
    const userId = req.userId
    const { ticketId } = req.params
    const { text } = req.body || {}
    const trimmed = typeof text === 'string' ? text.trim() : ''
    if (!trimmed) {
      return res.status(400).json({ error: 'Validation error', message: 'Message text is required' })
    }
    if (trimmed.length > 2000) {
      return res.status(400).json({ error: 'Validation error', message: 'Message must be at most 2000 characters' })
    }
    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID', message: 'Invalid ticket ID format' })
    }
    const ticket = await SupportTicket.findOne({ _id: ticketId, user: userId })
    if (!ticket) {
      return res.status(404).json({ error: 'Not found', message: 'Ticket not found' })
    }
    if (ticket.status !== 'ACCEPTED') {
      return res.status(403).json({
        error: 'Chat not available',
        message: 'You can send messages only after an admin accepts this ticket.'
      })
    }
    const message = {
      _id: new mongoose.Types.ObjectId(),
      senderId: new mongoose.Types.ObjectId(userId),
      text: trimmed,
      createdAt: new Date()
    }
    await SupportTicket.updateOne(
      { _id: ticketId },
      { $push: { messages: message } }
    )
    const payload = {
      _id: message._id,
      senderId: userId,
      text: message.text,
      createdAt: message.createdAt
    }
    emitTicketMessage(ticketId, payload)
    return res.status(201).json({ message: 'Message sent', data: payload })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to send message'
    })
  }
}

// GET /api/admin/tickets - List all tickets (admin)
const getTickets = async (req, res) => {
  try {
    const { status, type } = req.query
    const query = {}
    if (status && ['PENDING', 'OPEN', 'ACCEPTED', 'RESOLVED', 'REJECTED'].includes(status)) query.status = status
    if (type && ['MOBILE_UPDATE', 'SUPPORT'].includes(type)) query.type = type

    const tickets = await SupportTicket.find(query)
      .populate('user', 'name email phone')
      .populate('acceptedBy', 'name email')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean()

    return res.status(200).json({ tickets })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to fetch tickets'
    })
  }
}

// GET /api/admin/tickets/:ticketId - Get one ticket (admin) with messages
const getAdminTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params
    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID', message: 'Invalid ticket ID format' })
    }
    const ticket = await SupportTicket.findById(ticketId)
      .populate('user', 'name email phone')
      .populate('acceptedBy', 'name email')
      .populate('resolvedBy', 'name email')
      .lean()
    if (!ticket) {
      return res.status(404).json({ error: 'Not found', message: 'Ticket not found' })
    }
    return res.status(200).json({ ticket })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to fetch ticket'
    })
  }
}

// PATCH /api/admin/tickets/:ticketId/accept - Accept support ticket (admin); starts chat
const acceptTicket = async (req, res) => {
  try {
    const adminId = req.userId
    const { ticketId } = req.params
    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID', message: 'Invalid ticket ID format' })
    }
    const ticket = await SupportTicket.findById(ticketId)
    if (!ticket) {
      return res.status(404).json({ error: 'Not found', message: 'Ticket not found' })
    }
    if (ticket.type !== 'SUPPORT') {
      return res.status(400).json({ error: 'Invalid type', message: 'Only support tickets can be accepted' })
    }
    if (ticket.status !== 'OPEN') {
      return res.status(400).json({ error: 'Already processed', message: 'This ticket is already accepted or closed' })
    }
    ticket.status = 'ACCEPTED'
    ticket.acceptedBy = adminId
    ticket.acceptedAt = new Date()
    await ticket.save()
    const updated = await SupportTicket.findById(ticketId)
      .populate('user', 'name email phone')
      .populate('acceptedBy', 'name email')
      .lean()
    return res.status(200).json({
      message: 'Ticket accepted. You can now chat with the user.',
      ticket: updated
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to accept ticket'
    })
  }
}

// POST /api/admin/tickets/:ticketId/messages - Send message (admin; only when ACCEPTED)
const sendAdminTicketMessage = async (req, res) => {
  try {
    const adminId = req.userId
    const { ticketId } = req.params
    const { text } = req.body || {}
    const trimmed = typeof text === 'string' ? text.trim() : ''
    if (!trimmed) {
      return res.status(400).json({ error: 'Validation error', message: 'Message text is required' })
    }
    if (trimmed.length > 2000) {
      return res.status(400).json({ error: 'Validation error', message: 'Message must be at most 2000 characters' })
    }
    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID', message: 'Invalid ticket ID format' })
    }
    const ticket = await SupportTicket.findById(ticketId)
    if (!ticket) {
      return res.status(404).json({ error: 'Not found', message: 'Ticket not found' })
    }
    if (ticket.status !== 'ACCEPTED') {
      return res.status(403).json({
        error: 'Chat not available',
        message: 'Ticket must be accepted before sending messages.'
      })
    }
    const message = {
      _id: new mongoose.Types.ObjectId(),
      senderId: new mongoose.Types.ObjectId(adminId),
      text: trimmed,
      createdAt: new Date()
    }
    await SupportTicket.updateOne(
      { _id: ticketId },
      { $push: { messages: message } }
    )
    const payload = {
      _id: message._id,
      senderId: adminId,
      text: message.text,
      createdAt: message.createdAt
    }
    emitTicketMessage(ticketId, payload)
    return res.status(201).json({ message: 'Message sent', data: payload })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to send message'
    })
  }
}

// PATCH /api/admin/tickets/:ticketId/resolve - Resolve ticket (admin): MOBILE_UPDATE set newPhone; SUPPORT just close
const resolveTicket = async (req, res) => {
  try {
    const adminId = req.userId
    const { ticketId } = req.params
    const { status, newPhone, adminNotes } = req.body

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID', message: 'Invalid ticket ID format' })
    }

    const ticket = await SupportTicket.findById(ticketId).populate('user', 'phone')
    if (!ticket) {
      return res.status(404).json({ error: 'Not found', message: 'Ticket not found' })
    }

    const isSupport = ticket.type === 'SUPPORT'
    const allowedOpen = isSupport ? ['OPEN', 'ACCEPTED'] : ['PENDING']
    if (!allowedOpen.includes(ticket.status)) {
      return res.status(400).json({ error: 'Already processed', message: 'This ticket has already been resolved or rejected' })
    }

    const resolvedStatus = status === 'REJECTED' ? 'REJECTED' : 'RESOLVED'

    if (!isSupport && resolvedStatus === 'RESOLVED') {
      const digits = (newPhone || '').replace(/\D/g, '')
      if (digits.length !== 10) {
        return res.status(400).json({
          error: 'Invalid phone',
          message: 'Provide a valid 10-digit phone to resolve'
        })
      }
      const existingUser = await User.findOne({ phone: digits, _id: { $ne: ticket.user._id } })
      if (existingUser) {
        return res.status(400).json({
          error: 'Phone taken',
          message: 'This phone number is already registered to another user'
        })
      }
      await User.findByIdAndUpdate(ticket.user._id, { $set: { phone: digits } })
      ticket.newPhone = digits
    }

    ticket.status = resolvedStatus
    ticket.resolvedBy = adminId
    ticket.resolvedAt = new Date()
    ticket.adminNotes = (adminNotes || '').trim().slice(0, 500)
    await ticket.save()

    const updated = await SupportTicket.findById(ticketId)
      .populate('user', 'name email phone')
      .populate('acceptedBy', 'name email')
      .populate('resolvedBy', 'name email')
      .lean()

    return res.status(200).json({
      message: isSupport
        ? (resolvedStatus === 'RESOLVED' ? 'Ticket closed.' : 'Ticket rejected.')
        : (resolvedStatus === 'RESOLVED' ? 'Ticket resolved and user phone updated.' : 'Ticket rejected.'),
      ticket: updated
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to resolve ticket'
    })
  }
}

module.exports = {
  createTicket,
  getMyTickets,
  getMyTicketById,
  sendUserTicketMessage,
  getTickets,
  getAdminTicketById,
  acceptTicket,
  sendAdminTicketMessage,
  resolveTicket
}
