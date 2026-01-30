const mongoose = require('mongoose')

const adminLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    trim: true
  },
  resource: {
    type: String,
    trim: true
  },
  resourceId: {
    type: String,
    trim: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  ip: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

adminLogSchema.index({ adminId: 1, createdAt: -1 })
adminLogSchema.index({ resource: 1, resourceId: 1 })
adminLogSchema.index({ createdAt: -1 })

const AdminLog = mongoose.model('AdminLog', adminLogSchema)
module.exports = AdminLog
