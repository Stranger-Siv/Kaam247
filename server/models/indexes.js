/**
 * Database Indexes for Performance Optimization
 * 
 * Run this script to add indexes to your MongoDB collections
 * Or add these indexes manually in MongoDB Compass or via Mongoose schemas
 * 
 * Usage:
 * 1. Add indexes to schemas in model files
 * 2. Or run: node -e "require('./models/Task').createIndexes()"
 */

const mongoose = require('mongoose')
const Task = require('./Task')
const User = require('./User')

/**
 * Recommended Indexes for Task Collection
 */
const taskIndexes = [
    // Status index - frequently queried
    { status: 1 },

    // Location index - for geospatial queries
    { 'location.coordinates': '2dsphere' },

    // PostedBy index - for user's posted tasks
    { postedBy: 1 },

    // AcceptedBy index - for worker's accepted tasks
    { acceptedBy: 1 },

    // Category index - for filtering
    { category: 1 },

    // ScheduledAt index - for date-based queries
    { scheduledAt: 1 },

    // CreatedAt index - for sorting
    { createdAt: -1 },

    // Compound indexes for common queries
    { status: 1, 'location.coordinates': '2dsphere' }, // Available tasks by location
    { postedBy: 1, status: 1 }, // User's tasks by status
    { acceptedBy: 1, status: 1 }, // Worker's tasks by status
    { category: 1, status: 1 }, // Tasks by category and status
    { status: 1, createdAt: -1 }, // Tasks by status, newest first
]

/**
 * Recommended Indexes for User Collection
 */
const userIndexes = [
    // Email index - unique, frequently queried
    { email: 1 },

    // Phone index - unique, frequently queried
    { phone: 1 },

    // Status index - for filtering active users
    { status: 1 },

    // Role index - for admin queries
    { role: 1 },

    // Location index - for geospatial queries
    { 'location.coordinates': '2dsphere' },

    // LastSeen index - for online/offline status
    { lastSeen: -1 },

    // Compound indexes
    { status: 1, role: 1 }, // Active users by role
    { status: 1, 'location.coordinates': '2dsphere' }, // Active users by location
]

/**
 * Add indexes to Task collection
 */
async function addTaskIndexes() {
    try {
        const collection = mongoose.connection.collection('tasks')

        for (const index of taskIndexes) {
            try {
                await collection.createIndex(index)
            } catch (error) {
                // Ignore (e.g. index already exists)
            }
        }
    } catch (error) { }
}

/**
 * Add indexes to User collection
 */
async function addUserIndexes() {
    try {
        const collection = mongoose.connection.collection('users')

        for (const index of userIndexes) {
            try {
                await collection.createIndex(index)
            } catch (error) {
                // Ignore (e.g. index already exists)
            }
        }
    } catch (error) { }
}

/**
 * Add all indexes
 */
async function addAllIndexes() {
    if (mongoose.connection.readyState !== 1) {
        return
    }

    await addTaskIndexes()
    await addUserIndexes()
}

// Export for use in other files
module.exports = {
    addTaskIndexes,
    addUserIndexes,
    addAllIndexes,
    taskIndexes,
    userIndexes
}

// If run directly, add indexes (call connectDB first; one connection)
if (require.main === module) {
    const connectDB = require('../config/db')
    connectDB()
        .then(() => addAllIndexes())
        .then(() => process.exit(0))
        .catch((err) => {
            console.error(err)
            process.exit(1)
        })
}

