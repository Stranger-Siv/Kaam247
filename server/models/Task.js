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
    isOnCampus: {
        type: Boolean,
        default: false,
        description: 'True if task is on campus (college pilot: visible within campus radius)'
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
    },
    viewCount: {
        type: Number,
        default: 0,
        description: 'Number of times task detail was viewed (for analytics)'
    },
    acceptedAt: {
        type: Date,
        required: false,
        description: 'When a worker accepted the task (for time-to-acceptance analytics)'
    },
    // Recurring: template and schedule
    isRecurringTemplate: {
        type: Boolean,
        default: false,
        description: 'If true, this task is a template for recurring tasks'
    },
    recurringSchedule: {
        frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'weekly' },
        nextRunAt: { type: Date, default: null },
        paused: { type: Boolean, default: false }
    },
    sourceTemplateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        default: null,
        description: 'If this task was created from a recurring template'
    }
})

// Indexes aligned to actual query patterns (see docs/INDEX_AUDIT.md). No text/wildcard; no status+geo (getAvailableTasks filters in app).
taskSchema.index({ status: 1 })
taskSchema.index({ postedBy: 1 })
taskSchema.index({ acceptedBy: 1 })
taskSchema.index({ category: 1 })
taskSchema.index({ createdAt: -1 })
taskSchema.index({ completedAt: 1 })
taskSchema.index({ acceptedAt: 1 })
// getAvailableTasks: status + isHidden + isRecurringTemplate, sort by createdAt
taskSchema.index({ status: 1, isHidden: 1, isRecurringTemplate: 1, createdAt: -1 })
// getTasksByUser / getActivity: postedBy + sort or filter by status/createdAt
taskSchema.index({ postedBy: 1, status: 1 })
taskSchema.index({ postedBy: 1, createdAt: -1 })
// getEarnings / getActivity / getWorkers: acceptedBy + status or createdAt
taskSchema.index({ acceptedBy: 1, status: 1 })
taskSchema.index({ acceptedBy: 1, createdAt: -1 })
// Admin task list + dashboard: category+status, status+createdAt
taskSchema.index({ category: 1, status: 1 })
taskSchema.index({ status: 1, createdAt: -1 })
// location.coordinates: 2dsphere is defined on the subdocument above

const Task = mongoose.model('Task', taskSchema)

module.exports = Task

