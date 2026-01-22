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
        description: 'Firebase Authentication UID for phone OTP users'
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
            index: '2dsphere',
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
    lastActionTimestamps: {
        type: Map,
        of: Date,
        default: {},
        description: 'Map of action types to last execution timestamp (for throttling)'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const User = mongoose.model('User', userSchema)

module.exports = User

