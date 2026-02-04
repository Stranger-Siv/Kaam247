const mongoose = require('mongoose')

const ticketMessageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true })

const supportTicketSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['MOBILE_UPDATE', 'SUPPORT'],
    default: 'MOBILE_UPDATE'
  },
  /** For SUPPORT: short subject line */
  subject: {
    type: String,
    trim: true,
    maxlength: 200,
    default: ''
  },
  /** For SUPPORT: first message from user when creating ticket */
  initialMessage: {
    type: String,
    trim: true,
    maxlength: 2000,
    default: ''
  },
  requestedPhone: {
    type: String,
    trim: true,
    maxlength: 15,
    description: 'New 10-digit phone requested by user'
  },
  reason: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  status: {
    type: String,
    enum: ['PENDING', 'OPEN', 'ACCEPTED', 'RESOLVED', 'REJECTED'],
    default: 'PENDING'
  },
  /** Admin who accepted the ticket (SUPPORT only); chat starts after accept */
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  acceptedAt: {
    type: Date,
    required: false
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  resolvedAt: {
    type: Date,
    required: false
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  newPhone: {
    type: String,
    trim: true,
    required: false,
    description: 'Phone set by admin when resolving'
  },
  /** Chat messages (user + admin) once ticket is ACCEPTED */
  messages: [ticketMessageSchema]
}, { timestamps: true })

supportTicketSchema.index({ user: 1, status: 1 })
supportTicketSchema.index({ type: 1, status: 1 })

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema)
module.exports = SupportTicket
