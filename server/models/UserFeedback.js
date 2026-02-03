const mongoose = require('mongoose')

const userFeedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: false,
    description: 'Optional 1-5 rating'
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
})

const UserFeedback = mongoose.model('UserFeedback', userFeedbackSchema)
module.exports = UserFeedback
