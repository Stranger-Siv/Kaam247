const SupportTicket = require('../models/SupportTicket')
const User = require('../models/User')
const mongoose = require('mongoose')

// POST /api/users/me/tickets - Create a support ticket (e.g. phone change request)
const createTicket = async (req, res) => {
  try {
    const userId = req.userId
    const { type = 'MOBILE_UPDATE', requestedPhone, reason } = req.body

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

    const populated = await SupportTicket.findById(ticket._id).populate('user', 'name email phone')

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

// GET /api/admin/tickets - List all tickets (admin)
const getTickets = async (req, res) => {
  try {
    const { status, type } = req.query
    const query = {}
    if (status && ['PENDING', 'RESOLVED', 'REJECTED'].includes(status)) query.status = status
    if (type && type === 'MOBILE_UPDATE') query.type = type

    const tickets = await SupportTicket.find(query)
      .populate('user', 'name email phone')
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

// PATCH /api/admin/tickets/:ticketId/resolve - Resolve ticket (admin): set newPhone to update user's phone
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
    if (ticket.status !== 'PENDING') {
      return res.status(400).json({ error: 'Already processed', message: 'This ticket has already been resolved or rejected' })
    }

    const resolvedStatus = status === 'REJECTED' ? 'REJECTED' : 'RESOLVED'
    const digits = (newPhone || '').replace(/\D/g, '')

    if (resolvedStatus === 'RESOLVED') {
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
      .populate('resolvedBy', 'name email')

    return res.status(200).json({
      message: resolvedStatus === 'RESOLVED' ? 'Ticket resolved and user phone updated.' : 'Ticket rejected.',
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
  getTickets,
  resolveTicket
}
