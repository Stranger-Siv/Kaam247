const mongoose = require('mongoose')

const reportSchema = new mongoose.Schema({
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        description: 'User who reported'
    },
    reportedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        description: 'User being reported (optional if reporting task only)'
    },
    description: {
        type: String,
        required: false,
        trim: true,
        maxlength: 300,
        description: 'Additional description from reporter'
    },
    reportedTask: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: false,
        description: 'Task related to the report (if applicable)'
    },
    reason: {
        type: String,
        required: true,
        trim: true,
        description: 'Reason for the report'
    },
    status: {
        type: String,
        enum: ['open', 'resolved'],
        default: 'open'
    },
    adminNotes: {
        type: String,
        required: false,
        trim: true,
        description: 'Admin notes on resolution'
    },
    resolvedAt: {
        type: Date,
        required: false,
        description: 'When the report was resolved'
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        description: 'Admin who resolved the report'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const Report = mongoose.model('Report', reportSchema)

module.exports = Report

