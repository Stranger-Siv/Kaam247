const { Server } = require('socket.io')
const User = require('../models/User')
const Task = require('../models/Task')
const socketManager = require('./socketManager')
const { calculateDistance } = require('../utils/distance')
const { sendPushToUser } = require('../utils/pushNotifications')

const CHAT_ROOM_PREFIX = 'chat_'
const TICKET_CHAT_ROOM_PREFIX = 'ticket_'

let io = null

const initializeSocket = (server) => {
    // Socket.IO CORS configuration - production-only origins
    const allowedSocketOrigins = [
        'https://kaam247.in',
        'https://www.kaam247.in'
    ]

    io = new Server(server, {
        transports: ['websocket'],
        allowEIO3: true,
        cors: {
            origin: function (origin, callback) {
                if (!origin) return callback(null, true)
                const isAllowed = allowedSocketOrigins.includes(origin)
                if (isAllowed) {
                    callback(null, true)
                } else {
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
            } catch (error) { }
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
            } catch (error) { }
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
            } catch (error) { }
        })

        // Handle worker going online (toggle ON)
        socket.on('worker_online', async (data) => {
            try {
                const { userId, location, radius } = data

                if (!userId) {
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
            } catch (error) { }
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

        // Task chat: join room (only participants; task status ACCEPTED, IN_PROGRESS, or COMPLETED)
        socket.on('join_task_chat', async (data) => {
            try {
                const taskId = (data && data.taskId) ? data.taskId : data
                if (!taskId || !socket.userId) return
                const mongoose = require('mongoose')
                if (!mongoose.Types.ObjectId.isValid(taskId)) return
                const task = await Task.findById(taskId).select('postedBy acceptedBy status').lean()
                if (!task) return
                const allowed = ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED']
                if (!allowed.includes(task.status)) return
                const posterId = task.postedBy?.toString()
                const workerId = task.acceptedBy?.toString()
                const userIdStr = socket.userId.toString()
                if (posterId !== userIdStr && workerId !== userIdStr) return
                socket.join(CHAT_ROOM_PREFIX + taskId)
            } catch (err) { }
        })

        socket.on('leave_task_chat', (data) => {
            const taskId = (data && data.taskId) ? data.taskId : data
            if (taskId) socket.leave(CHAT_ROOM_PREFIX + taskId)
        })

        // Support ticket chat: join room (user who owns ticket, or admin)
        socket.on('join_ticket_chat', async (data) => {
            try {
                const ticketId = (data && data.ticketId) ? data.ticketId : data
                if (!ticketId || !socket.userId) return
                const mongoose = require('mongoose')
                const SupportTicket = require('../models/SupportTicket')
                const User = require('../models/User')
                if (!mongoose.Types.ObjectId.isValid(ticketId)) return
                const ticket = await SupportTicket.findById(ticketId).select('user status acceptedBy').lean()
                if (!ticket) return
                const userIdStr = socket.userId.toString()
                const isUser = ticket.user && ticket.user.toString() === userIdStr
                const isAdmin = await User.findById(userIdStr).then(u => u && (u.role === 'admin' || u.isAdmin === true)).catch(() => false)
                if (isUser || isAdmin) {
                    socket.join(TICKET_CHAT_ROOM_PREFIX + ticketId)
                }
            } catch (err) { }
        })

        socket.on('leave_ticket_chat', (data) => {
            const ticketId = (data && data.ticketId) ? data.ticketId : data
            if (ticketId) socket.leave(TICKET_CHAT_ROOM_PREFIX + ticketId)
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

const broadcastNewTask = async (taskData, postedByUserId) => {
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

        if (!workers.length) {
            return
        }

        // Preload worker preferences in one query so we can filter by category
        const workerIds = workers.map(w => w.userId)
        const users = await User.find({ _id: { $in: workerIds } })
            .select('workerPreferences')
            .lean()
        const prefsByUserId = new Map(
            users.map(u => [u._id.toString(), u.workerPreferences || {}])
        )

        // Filter workers: exclude task creator, check distance and category preferences
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
                return false
            }

            // Only include if within radius (default 5km)
            const workerRadius = worker.radius || 5
            if (distance > workerRadius) {
                return false
            }

            // Respect worker category preferences, if any are set
            const prefs = prefsByUserId.get(worker.userId)
            const preferredCategories = prefs && Array.isArray(prefs.preferredCategories)
                ? prefs.preferredCategories
                : []

            // If worker has specified preferredCategories, only send tasks matching those
            if (preferredCategories.length > 0) {
                const taskCategory = (taskData.category || '').trim()
                if (!preferredCategories.includes(taskCategory)) {
                    return false
                }
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

                // Push notification – alarm-style; keep body short for small screens so multiple notifications stay readable
                const shortTitle = (taskData.title || '').length > 50 ? (taskData.title || '').slice(0, 47) + '...' : (taskData.title || '')
                sendPushToUser(worker.userId, 'New task near you', shortTitle, { taskId: taskData.taskId, type: 'new_task' }).catch(() => { })

                emittedCount++
            } catch (emitError) {
                // Silent fail - don't block task broadcast
            }
        })
    } catch (error) {
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

        // Push notification to poster (non-blocking)
        sendPushToUser(posterUserId, 'Worker accepted your task', 'A worker has accepted your task. Open the app to view.', { taskId: taskId.toString() }).catch(() => { })
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
    } catch (error) { }
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
    } catch (error) { }
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
    } catch (error) { }
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
    } catch (error) { }
}

// Broadcast admin stats refresh event to all connected admin users
const notifyAdminStatsRefresh = () => {
    if (!io) return

    try {
        io.emit('admin_stats_refresh', {
            timestamp: new Date().toISOString()
        })
    } catch (error) { }
}

// Task chat: broadcast new message to room (called from chatController after saving)
const emitReceiveMessage = (taskId, message) => {
    if (!io) return
    try {
        io.to(CHAT_ROOM_PREFIX + taskId).emit('receive_message', {
            taskId: taskId.toString(),
            message
        })
    } catch (error) { }
}

// Support ticket chat: broadcast new message to ticket room
const emitTicketMessage = (ticketId, message) => {
    if (!io) return
    try {
        io.to(TICKET_CHAT_ROOM_PREFIX + ticketId).emit('ticket_message', {
            ticketId: ticketId.toString(),
            message
        })
    } catch (error) { }
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
    notifyAdminStatsRefresh,
    emitReceiveMessage,
    emitTicketMessage
}

