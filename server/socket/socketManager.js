// Track online workers: userId -> {socketId, location: {lat, lng}, radius}
const onlineWorkers = new Map()

// Track all online users (workers + posters): userId -> socketId
const onlineUsers = new Map()

// Track socketId -> userId for cleanup
const socketToUser = new Map()

const addOnlineWorker = (socketId, userId, location = null, radius = 5) => {
    const userIdStr = userId.toString()
    
    // Check if worker is already online (update socket if different)
    if (onlineWorkers.has(userIdStr)) {
        const oldWorker = onlineWorkers.get(userIdStr)
        const oldSocketId = oldWorker.socketId || oldWorker // Handle old format
        if (oldSocketId !== socketId) {
            socketToUser.delete(oldSocketId)
        }
    }
    
    // Store worker info with location and radius
    onlineWorkers.set(userIdStr, {
        socketId,
        location: location || null,
        radius: radius || 5
    })
    onlineUsers.set(userIdStr, socketId) // Also track in general users map
    socketToUser.set(socketId, userIdStr)
}

const addOnlineUser = (socketId, userId) => {
    const userIdStr = userId.toString()
    onlineUsers.set(userIdStr, socketId)
    socketToUser.set(socketId, userIdStr)
}

const removeOnlineWorker = (socketId) => {
    const userId = socketToUser.get(socketId)
    if (userId) {
        onlineWorkers.delete(userId)
        onlineUsers.delete(userId) // Also remove from general users map
        socketToUser.delete(socketId)
    } else {
        // Try to find and remove by socketId if not in socketToUser map
        for (const [uid, workerData] of onlineWorkers.entries()) {
            const workerSocketId = workerData.socketId || workerData // Handle old format
            if (workerSocketId === socketId) {
                onlineWorkers.delete(uid)
                onlineUsers.delete(uid)
                break
            }
        }
    }
}

const removeOnlineUser = (socketId) => {
    const userId = socketToUser.get(socketId)
    if (userId) {
        onlineWorkers.delete(userId)
        onlineUsers.delete(userId)
        socketToUser.delete(socketId)
    }
}

const getOnlineWorkerSockets = () => {
    return Array.from(onlineWorkers.values()).map(worker => 
        typeof worker === 'object' ? worker.socketId : worker
    )
}

const getOnlineWorkerCount = () => {
    return onlineWorkers.size
}

const isWorkerOnline = (userId) => {
    return onlineWorkers.has(userId.toString())
}

const getWorkerSocketId = (userId) => {
    const worker = onlineWorkers.get(userId.toString())
    if (!worker) return null
    return typeof worker === 'object' ? worker.socketId : worker
}

const getAllWorkerSocketsExcept = (excludeUserId) => {
    const excludeId = excludeUserId.toString()
    return Array.from(onlineWorkers.entries())
        .filter(([userId]) => userId !== excludeId)
        .map(([, workerData]) => {
            return typeof workerData === 'object' ? workerData.socketId : workerData
        })
}

// Get worker location by userId
const getWorkerLocation = (userId) => {
    const worker = onlineWorkers.get(userId.toString())
    if (!worker) return null
    return typeof worker === 'object' ? worker.location : null
}

// Get all workers with their locations
const getAllWorkersWithLocations = () => {
    return Array.from(onlineWorkers.entries()).map(([userId, workerData]) => ({
        userId,
        socketId: typeof workerData === 'object' ? workerData.socketId : workerData,
        location: typeof workerData === 'object' ? workerData.location : null,
        radius: typeof workerData === 'object' ? (workerData.radius || 5) : 5
    }))
}

const getUserSocketId = (userId) => {
    return onlineUsers.get(userId.toString())
}

// Get all online workers (returns array of userIds)
const getOnlineWorkers = () => {
    return Array.from(onlineWorkers.keys())
}

module.exports = {
    addOnlineWorker,
    removeOnlineWorker,
    addOnlineUser,
    removeOnlineUser,
    getOnlineWorkerSockets,
    getOnlineWorkerCount,
    isWorkerOnline,
    getWorkerSocketId,
    getAllWorkerSocketsExcept,
    getUserSocketId,
    getOnlineWorkers,
    getWorkerLocation,
    getAllWorkersWithLocations
}

