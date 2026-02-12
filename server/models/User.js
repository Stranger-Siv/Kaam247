const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: false, // Optional for Firebase phone auth users
        unique: true,
        sparse: true, // Allows multiple null values
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: false, // Optional for Google auth users
        unique: true,
        sparse: true, // Allows multiple null values
        trim: true
    },
    password: {
        type: String,
        required: false, // Optional for Firebase phone auth users
        select: false,
        description: 'hashed password only'
    },
    firebaseUID: {
        type: String,
        required: false,
        unique: true,
        sparse: true,
        trim: true,
        description: 'Firebase Authentication UID (reserved for future use)'
    },
    googleId: {
        type: String,
        required: false,
        unique: true,
        sparse: true,
        trim: true,
        description: 'Google OAuth ID for Google sign-in users'
    },
    phoneVerified: {
        type: Boolean,
        default: false,
        description: 'Whether phone number is verified via Firebase'
    },
    profileSetupCompleted: {
        type: Boolean,
        default: false,
        description: 'Whether user has completed initial profile setup after Firebase auth'
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            description: '[longitude, latitude]'
        },
        area: {
            type: String
        },
        city: {
            type: String
        }
    },
    locationUpdatedAt: {
        type: Date,
        required: false,
        description: 'Last time user location was updated'
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    roleMode: {
        type: String,
        enum: ['worker', 'poster'],
        default: 'worker'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: ['active', 'blocked', 'banned'],
        default: 'active'
    },
    cancellationCountToday: {
        type: Number,
        default: 0,
        min: 0,
        description: 'Number of cancellations today (admin tracking)'
    },
    lastOnlineAt: {
        type: Date,
        required: false,
        description: 'Last time user was online'
    },
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
        description: 'Average rating from completed tasks (for workers)'
    },
    totalRatings: {
        type: Number,
        default: 0,
        min: 0,
        description: 'Total number of ratings received (for workers)'
    },
    profilePhoto: {
        type: String,
        required: false,
        trim: true,
        description: 'URL to user profile photo'
    },
    dailyCancelCount: {
        type: Number,
        default: 0,
        min: 0,
        description: 'Number of tasks cancelled by worker today'
    },
    lastCancelDate: {
        type: Date,
        required: false,
        description: 'Date of last cancellation (used to reset daily count)'
    },
    totalCancelLimit: {
        type: Number,
        default: 2,
        min: 0,
        max: 10,
        description: 'Maximum daily cancellations allowed (admin configurable, default: 2)'
    },
    noShowCount: {
        type: Number,
        default: 0,
        min: 0,
        description: 'Number of times worker was marked as no-show by poster (college pilot accountability)'
    },
    dailyTaskPostCount: {
        type: Number,
        default: 0,
        min: 0,
        description: 'Number of tasks posted today (for rate limiting)'
    },
    lastTaskPostDate: {
        type: Date,
        required: false,
        description: 'Date of last task post (used to reset daily count)'
    },
    dailyReportCount: {
        type: Number,
        default: 0,
        min: 0,
        description: 'Number of reports submitted today (for rate limiting)'
    },
    lastReportDate: {
        type: Date,
        required: false,
        description: 'Date of last report (used to reset daily count)'
    },
    dailyWorkerCancelCount: {
        type: Number,
        default: 0,
        min: 0,
        description: 'Number of workers canceled/changed by poster today (for rate limiting abuse prevention)'
    },
    lastWorkerCancelDate: {
        type: Date,
        required: false,
        description: 'Date of last worker cancellation by poster (used to reset daily count)'
    },
    maxWorkerCancelPerDay: {
        type: Number,
        default: 3,
        min: 1,
        max: 10,
        description: 'Maximum workers poster can cancel per day (admin configurable, default: 3)'
    },
    lastActionTimestamps: {
        type: Map,
        of: Date,
        default: {},
        description: 'Map of action types to last execution timestamp (for throttling)'
    },
    workerPreferences: {
        preferredCategories: {
            type: [String],
            default: [],
            description: 'Categories the worker prefers to see first (e.g. Cleaning, Delivery)'
        },
        defaultRadiusKm: {
            type: Number,
            default: 5,
            min: 1,
            max: 10,
            description: 'Default search radius in km when browsing tasks'
        }
    },
    savedTasks: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Task',
        default: [],
        description: 'Task IDs bookmarked by worker (favorites)'
    },
    availabilitySchedule: {
        enabled: { type: Boolean, default: false },
        slots: [{
            dayOfWeek: { type: Number, min: 0, max: 6 },
            startTime: { type: String },
            endTime: { type: String }
        }]
    },
    fcmToken: {
        type: String,
        default: null,
        trim: true,
        description: 'FCM token for push notifications (legacy single device)'
    },
    fcmTokens: {
        type: [String],
        default: [],
        trim: true,
        description: 'FCM tokens for push notifications (multiple devices: phone + Chrome, etc.)'
    },
    onboardingFeedback: {
        useCase: { type: String, trim: true, maxlength: 500 },
        suggestions: { type: String, trim: true, maxlength: 1000 },
        submittedAt: { type: Date }
    },
    taskTemplates: {
        type: [{
            name: {
                type: String,
                required: true,
                trim: true,
                maxlength: 50
            },
            title: {
                type: String,
                required: true,
                trim: true
            },
            description: {
                type: String,
                required: true,
                trim: true
            },
            category: {
                type: String,
                required: true,
                trim: true
            },
            budget: {
                type: Number,
                required: true,
                min: 1
            },
            expectedDuration: {
                type: Number,
                required: false,
                min: 1
            },
            location: {
                area: String,
                city: String,
                fullAddress: String
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }],
        default: [],
        description: 'Saved task templates for quick reposting'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

// Indexes aligned to actual query patterns (see docs/INDEX_AUDIT.md). email/phone/googleId from unique; location from subdocument.
userSchema.index({ role: 1 })
userSchema.index({ status: 1 })
userSchema.index({ createdAt: -1 })
userSchema.index({ lastOnlineAt: -1 })
// Admin: count/list by status+role; list users by role, sort by createdAt
userSchema.index({ status: 1, role: 1 })
userSchema.index({ role: 1, createdAt: -1 })
// GeoJSON 2dsphere index on location (parent field, not location.coordinates)
userSchema.index({ location: '2dsphere' })

const User = mongoose.model('User', userSchema)

module.exports = User

