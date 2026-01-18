const { Server } = require('socket.io')
const User = require('../models/User')
const socketManager = require('./socketManager')
const { calculateDistance } = require('../utils/distance')

let io = null

const initializeSocket = (server) => {
    // Socket.IO CORS configuration - match Express CORS
    const allowedSocketOrigins = [
        'https://kaam247.netlify.app',           // Netlify frontend (production)
        'https://kaam247.onrender.com',           // Render frontend (if deployed there)
        'http://localhost:5173',                  // Vite dev server
        'http://localhost:3000',                  // Alternative dev port
        'http://localhost:3001',                  // Local backend (for testing)
        'http://127.0.0.1:5173',                  // Alternative localhost format
        'http://127.0.0.1:3000',                  // Alternative localhost format
    ]

    io = new Server(server, {
        cors: {
            origin: function (origin, callback) {
                // Allow requests with no origin
                if (!origin) return callback(null, true)
                
                // Check if origin is allowed
                const isAllowed = allowedSocketOrigins.some(allowedOrigin => {
                    if (origin === allowedOrigin) return true
                    if (allowedOrigin.includes('localhost') && origin.includes('localhost')) return true
                    if (allowedOrigin.includes('127.0.0.1') && origin.includes('127.0.0.1')) return true
                    return false
                })

                if (isAllowed || process.env.NODE_ENV !== 'production') {
                    callback(null, true)
                } else {
                    console.log('Socket.IO CORS: Blocked origin:', origin)
                    callback(new Error('Not allowed by CORS'))
                }
            },
            methods: ['GET', 'POST'],
            credentials: true
        }
    })

    io.on('connection', async (socket) => {
        // Track alerted task IDs per socket to prevent duplicates
        socket.alertedTaskIds = new Set()

        // STATE RECOVERY: Handle clientConnected event with full user context
        socket.on('clientConnected', async (data) => {
            try {
                const { userId, role, mode, isOnline, location } = data
                
                if (!userId) {
                    return
                }

                // Update lastSeen timestamp (if user exists)
                const mongoose = require('mongoose')
                if (mongoose.Types.ObjectId.isValid(userId)) {
                    await User.findByIdAndUpdate(userId, {
                        lastOnlineAt: new Date()
                    }, { new: false })
                }

                // Register worker if mode is worker and online
                if (mode === 'worker' && isOnline) {
                    socketManager.addOnlineWorker(socket.id, userId, location, 5)
                } else if (mode === 'poster') {
                    socketManager.addOnlineUser(socket.id, userId)
                }
            } catch (error) {
                console.error('Error handling clientConnected:', error.message)
            }
        })

        // Handle register_user event (primary registration method)
        socket.on('register_user', async (data) => {
            try {
                const { userId, role } = data

                if (!userId || !role) {
                    return
                }

                // Check if userId is a valid ObjectId
                const mongoose = require('mongoose')
                const isValidObjectId = mongoose.Types.ObjectId.isValid(userId)

                let userRole = role
                if (isValidObjectId) {
                    // Verify user exists
                    const user = await User.findById(userId)
                    if (user) {
                        userRole = user.roleMode || user.role || role
                    }
                }

                // Store user info on socket
                socket.userId = userId.toString()
                socket.roleMode = userRole

                // If role is worker, add to online workers store (without location - will be set when worker_online is called)
                if (userRole === 'worker') {
                    socketManager.addOnlineWorker(socket.id, userId, null, 5)
                } else {
                    // Track as general user (for posters)
                    socketManager.addOnlineUser(socket.id, userId)
                }
            } catch (error) {
                console.error('Error handling register_user:', error.message)
            }
        })

        // Handle user going online (general tracking for posters and workers)
        socket.on('user_online', async (data) => {
            try {
                const { userId } = data

                if (!userId) {
                    return
                }

                // Check if userId is a valid ObjectId
                const mongoose = require('mongoose')
                const isValidObjectId = mongoose.Types.ObjectId.isValid(userId)

                let roleMode = 'worker' // Default
                if (isValidObjectId) {
                    // Verify user exists
                    const user = await User.findById(userId)
                    if (user) {
                        roleMode = user.roleMode
                    }
                }

                // Track user (for poster notifications)
                socketManager.addOnlineUser(socket.id, userId)
                socket.userId = userId.toString()
                socket.roleMode = roleMode
            } catch (error) {
                console.error('Error handling user_online:', error.message)
            }
        })

        // Handle worker going online (toggle ON)
        socket.on('worker_online', async (data) => {
            try {
                const { userId, location, radius } = data

                if (!userId) {
                    console.log('worker_online event missing userId')
                    return
                }

                // Use userId from socket if not provided in data
                const workerId = userId || socket.userId

                if (!workerId) {
                    return
                }

                // Check if userId is a valid ObjectId
                const mongoose = require('mongoose')
                const isValidObjectId = mongoose.Types.ObjectId.isValid(workerId)

                if (isValidObjectId) {
                    // Verify user exists and is a worker
                    const user = await User.findById(workerId)
                    if (user && user.roleMode !== 'worker' && user.role !== 'worker') {
                        return
                    }
                }

                // Parse location if provided
                let workerLocation = null
                if (location && location.lat !== undefined && location.lng !== undefined) {
                    workerLocation = {
                        lat: parseFloat(location.lat),
                        lng: parseFloat(location.lng)
                    }
                }

                // Use provided radius or default to 5 km
                const workerRadius = radius ? parseFloat(radius) : 5

                // Ensure worker is in online workers store with location
                socketManager.addOnlineWorker(socket.id, workerId, workerLocation, workerRadius)
                socket.userId = workerId.toString()
                socket.roleMode = 'worker'
                socket.location = workerLocation
            } catch (error) {
                console.error('Error handling worker_online:', error.message)
            }
        })

        // Handle worker going offline (toggle OFF)
        socket.on('worker_offline', () => {
            const userId = socket.userId
            socketManager.removeOnlineWorker(socket.id)

            // Clear alerted task IDs when worker goes offline
            if (socket.alertedTaskIds) {
                socket.alertedTaskIds.clear()
            }

            // Worker offline - no logging needed
        })

        // Handle disconnect
        socket.on('disconnect', async () => {
            const userId = socket.userId
            const roleMode = socket.roleMode

            // STATE RECOVERY: On disconnect, DO NOT change task state
            // Only update lastSeen timestamp and remove from online tracking

            // Clear alerted task IDs on disconnect
            if (socket.alertedTaskIds) {
                socket.alertedTaskIds.clear()
            }

            // Update lastSeen timestamp (if user exists)
            if (userId) {
                try {
                    const mongoose = require('mongoose')
                    if (mongoose.Types.ObjectId.isValid(userId)) {
                        await User.findByIdAndUpdate(userId, {
                            lastOnlineAt: new Date()
                        }, { new: false })
                    }
                } catch (error) {
                    // Silent fail - don't block disconnect
                }
            }

            // Remove from online workers if it was a worker
            if (roleMode === 'worker') {
                socketManager.removeOnlineWorker(socket.id)
            } else {
                // Remove from general users
                socketManager.removeOnlineUser(socket.id)
            }
        })
    })

    return io
}

const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized. Call initializeSocket first.')
    }
    return io
}

const broadcastNewTask = (taskData, postedByUserId) => {
    try {
        if (!io) {
            return
        }

        // Get total count of online workers
        const totalWorkers = socketManager.getOnlineWorkerCount()

        if (totalWorkers === 0) {
            return
        }

        // Get task location
        const taskLocation = taskData.location?.coordinates
        if (!taskLocation || taskLocation.length !== 2) {
            return
        }

        const [taskLng, taskLat] = taskLocation

        // Get all workers with their locations
        const workers = socketManager.getAllWorkersWithLocations()
        
        // Filter workers: exclude task creator and check distance
        const eligibleWorkers = workers.filter(worker => {
            // Exclude task creator
            if (worker.userId === postedByUserId.toString()) {
                return false
            }

            // If worker has no location, exclude them
            if (!worker.location || !worker.location.lat || !worker.location.lng) {
                return false
            }

            // Validate coordinates before calculating distance
            if (isNaN(worker.location.lat) || isNaN(worker.location.lng) || 
                worker.location.lat < -90 || worker.location.lat > 90 ||
                worker.location.lng < -180 || worker.location.lng > 180) {
                return false
            }

            if (isNaN(taskLat) || isNaN(taskLng) ||
                taskLat < -90 || taskLat > 90 ||
                taskLng < -180 || taskLng > 180) {
                return false
            }

            // Calculate distance
            let distance
            try {
                distance = calculateDistance(
                    worker.location.lat,
                    worker.location.lng,
                    taskLat,
                    taskLng
                )
            } catch (error) {
                console.error(`Error calculating distance for worker ${worker.userId}:`, error.message)
                return false
            }

            // Only include if within radius (default 5km)
            const workerRadius = worker.radius || 5
            if (distance > workerRadius) {
                return false
            }

            // Check if this task was already alerted to this worker
            const workerSocket = io.sockets.sockets.get(worker.socketId)
            if (workerSocket && workerSocket.alertedTaskIds && workerSocket.alertedTaskIds.has(taskData.taskId)) {
                return false // Already alerted, skip
            }

            return true
        })

        if (eligibleWorkers.length === 0) {
            return
        }

        // Emit to eligible worker sockets with distance included
        let emittedCount = 0
        eligibleWorkers.forEach((worker) => {
            try {
                // Calculate distance for this worker
                const distance = calculateDistance(
                    worker.location.lat,
                    worker.location.lng,
                    taskLat,
                    taskLng
                )

                // Prepare alert payload with distance
                const alertPayload = {
                    taskId: taskData.taskId,
                    title: taskData.title,
                    category: taskData.category,
                    budget: taskData.budget,
                    distanceKm: Math.round(distance * 10) / 10, // Round to 1 decimal
                    location: taskData.location
                }

                // Emit to worker
                io.to(worker.socketId).emit('new_task', alertPayload)
                
                // Mark task as alerted to this worker
                const workerSocket = io.sockets.sockets.get(worker.socketId)
                if (workerSocket) {
                    if (!workerSocket.alertedTaskIds) {
                        workerSocket.alertedTaskIds = new Set()
                    }
                    workerSocket.alertedTaskIds.add(taskData.taskId)
                }
                
                emittedCount++
            } catch (emitError) {
                // Silent fail - don't block task broadcast
            }
        })
    } catch (error) {
        console.error('Error broadcasting new task:', error.message)
        // Don't throw - task creation should succeed even if broadcast fails
    }
}

const notifyTaskAccepted = (posterUserId, taskId, workerId) => {
    try {
        if (!io) {
            return
        }

        const posterSocketId = socketManager.getUserSocketId(posterUserId)
        if (!posterSocketId) {
            return
        }

        io.to(posterSocketId).emit('task_accepted', {
            taskId: taskId.toString(),
            workerId: workerId.toString()
        })
    } catch (error) {
        // Silent fail - non-fatal
    }
}

const notifyTaskRemoved = (excludeWorkerId, taskId) => {
    try {
        if (!io) {
            return
        }

        const workerSockets = socketManager.getAllWorkerSocketsExcept(excludeWorkerId)
        if (workerSockets.length === 0) {
            return
        }

        workerSockets.forEach((socketId) => {
            io.to(socketId).emit('remove_task', {
                taskId: taskId.toString()
            })
        })
    } catch (error) {
        // Silent fail - non-fatal
    }
}

const notifyTaskCancelled = (userId, taskId, cancelledBy) => {
    try {
        if (!io) {
            return
        }

        const userSocketId = socketManager.getUserSocketId(userId)
        if (!userSocketId) {
            return
        }

        io.to(userSocketId).emit('task_cancelled', {
            taskId: taskId.toString(),
            cancelledBy: cancelledBy // 'poster' or 'worker'
        })
    } catch (error) {
        // Silently handle errors
    }
}

const notifyTaskCompleted = (posterUserId, workerUserId, taskId) => {
    try {
        if (!io) {
            return
        }

        // Notify poster
        const posterSocketId = socketManager.getUserSocketId(posterUserId)
        if (posterSocketId) {
            io.to(posterSocketId).emit('task_completed', {
                taskId: taskId.toString(),
                role: 'poster'
            })
        }

        // Notify worker
        const workerSocketId = socketManager.getUserSocketId(workerUserId)
        if (workerSocketId) {
            io.to(workerSocketId).emit('task_completed', {
                taskId: taskId.toString(),
                role: 'worker'
            })
        }
    } catch (error) {
        console.error('Error notifying task completion (non-fatal):', error.message)
    }
}

const notifyTaskStatusChanged = (userId, taskId, status) => {
    try {
        if (!io) {
            return
        }

        const userSocketId = socketManager.getUserSocketId(userId)
        if (userSocketId) {
            io.to(userSocketId).emit('task_status_changed', {
                taskId: taskId.toString(),
                status: status
            })
        }
    } catch (error) {
        console.error('Error notifying task status change (non-fatal):', error.message)
    }
}

// Notify user update (for admin actions)
const notifyUserUpdated = (userId, userData) => {
    if (!io) return

    try {
        const socketId = socketManager.getUserSocketId(userId)
        if (socketId) {
            io.to(socketId).emit('user_updated', {
                userId,
                ...userData
            })
        }
    } catch (error) {
        console.error('Error notifying user update:', error.message)
    }
}

// Notify task update (for admin actions)
const notifyTaskUpdated = (taskId, taskData) => {
    if (!io) return

    try {
        // Notify poster if exists
        if (taskData.postedBy) {
            const posterSocketId = socketManager.getUserSocketId(taskData.postedBy.toString())
            if (posterSocketId) {
                io.to(posterSocketId).emit('task_updated', {
                    taskId,
                    ...taskData
                })
            }
        }

        // Notify worker if exists
        if (taskData.acceptedBy) {
            const workerSocketId = socketManager.getUserSocketId(taskData.acceptedBy.toString())
            if (workerSocketId) {
                io.to(workerSocketId).emit('task_updated', {
                    taskId,
                    ...taskData
                })
            }
        }
    } catch (error) {
        console.error('Error notifying task update:', error.message)
    }
}

// Broadcast admin stats refresh event to all connected admin users
const notifyAdminStatsRefresh = () => {
    if (!io) return

    try {
        // Emit to all connected clients (admins can filter on frontend)
        io.emit('admin_stats_refresh', {
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('Error broadcasting admin stats refresh:', error.message)
    }
}

module.exports = {
    initializeSocket,
    getIO,
    broadcastNewTask,
    notifyTaskAccepted,
    notifyTaskRemoved,
    notifyTaskCancelled,
    notifyTaskCompleted,
    notifyTaskStatusChanged,
    notifyUserUpdated,
    notifyTaskUpdated,
    notifyAdminStatsRefresh
}

