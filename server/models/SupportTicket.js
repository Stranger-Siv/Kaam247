const mongoose = require('mongoose')

const supportTicketSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['MOBILE_UPDATE'],
    default: 'MOBILE_UPDATE'
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
    enum: ['PENDING', 'RESOLVED', 'REJECTED'],
    default: 'PENDING'
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
  }
}, { timestamps: true })

supportTicketSchema.index({ user: 1, status: 1 })
supportTicketSchema.index({ type: 1, status: 1 })

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema)
module.exports = SupportTicket
