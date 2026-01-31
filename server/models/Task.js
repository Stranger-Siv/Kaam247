const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    budget: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['OPEN', 'SEARCHING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'CANCELLED_BY_POSTER', 'CANCELLED_BY_WORKER', 'CANCELLED_BY_ADMIN'],
        default: 'OPEN'
    },
    isHidden: {
        type: Boolean,
        default: false,
        description: 'If true, task is hidden from public listings (admin moderation)'
    },
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    acceptedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            index: '2dsphere',
            description: '[longitude, latitude]'
        },
        area: {
            type: String
        },
        city: {
            type: String
        },
        fullAddress: {
            type: String,
            description: 'Poster full address: room no, flat, building, landmark, etc.'
        }
    },
    scheduledAt: {
        type: Date,
        required: false
    },
    expectedDuration: {
        type: Number,
        required: false,
        description: 'Expected duration in hours'
    },
    startedAt: {
        type: Date,
        required: false,
        description: 'Timestamp when worker started the task'
    },
    completedAt: {
        type: Date,
        required: false,
        description: 'Timestamp when task was completed'
    },
    workerCompleted: {
        type: Boolean,
        default: false,
        description: 'Flag set by worker when they mark task as complete (requires poster confirmation)'
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: false,
        description: 'Rating given by poster to worker (1-5 stars)'
    },
    review: {
        type: String,
        required: false,
        trim: true,
        description: 'Review text written by poster about worker'
    },
    ratedAt: {
        type: Date,
        required: false,
        description: 'Timestamp when rating was submitted'
    },
    lastAlertedAt: {
        type: Date,
        required: false,
        description: 'Timestamp when task was last alerted to workers (for 3-hour cooldown)'
    },
    expiresAt: {
        type: Date,
        required: false,
        description: 'Task listing expires at this time; after this the task is no longer available for workers'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const Task = mongoose.model('Task', taskSchema)

module.exports = Task

