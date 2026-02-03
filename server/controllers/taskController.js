const Task = require('../models/Task')
const User = require('../models/User')
const Chat = require('../models/Chat')
const mongoose = require('mongoose')
const { broadcastNewTask, notifyTaskAccepted, notifyTaskRemoved, notifyTaskCompleted, notifyTaskStatusChanged, notifyTaskUpdated } = require('../socket/socketHandler')
const { calculateDistance } = require('../utils/distance')
const socketManager = require('../socket/socketManager')

const createTask = async (req, res) => {
  try {
    const { title, description, category, budget, location, postedBy, expectedDuration, expiresAt: expiresAtBody, validForDays, isOnCampus } = req.body

    // Validate required fields exist
    if (!title || !description || !category || budget === undefined || budget === null || !location || !postedBy) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Please provide: title, description, category, budget, location, and postedBy'
      })
    }

    // Validate postedBy - must be a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(postedBy)) {
      return res.status(400).json({
        error: 'Invalid postedBy',
        message: 'postedBy must be a valid MongoDB ObjectId (24 hex characters)'
      })
    }

    // Check if postedBy user exists in database
    const userExists = await User.findById(postedBy)
    if (!userExists) {
      return res.status(400).json({
        error: 'User not found',
        message: 'postedBy user does not exist in database'
      })
    }

    // ABUSE PREVENTION: Check user status
    if (userExists.status !== 'active') {
      return res.status(403).json({
        error: 'Account not active',
        message: 'Your account is not active. Please contact support.'
      })
    }

    // NOTE: Daily task posting limit has been removed based on product decision.
    // We keep the rapid action throttling below to avoid accidental double-submits,
    // but there is no longer a hard per-day cap on how many tasks a user can post.
    // Variables like activeTasksToday / dailyTaskPostCount are no longer used as limits.

    // RAPID ACTION THROTTLING: Check if same action within 3 seconds
    const lastPostTimestamp = userExists.lastActionTimestamps?.get('createTask')
    if (lastPostTimestamp) {
      const timeSinceLastPost = Date.now() - new Date(lastPostTimestamp).getTime()
      if (timeSinceLastPost < 3000) {
        return res.status(429).json({
          error: 'Too many requests',
          message: 'Please wait a moment before posting another task.'
        })
      }
    }

    // Validate budget - must be a number and at least 50
    const budgetNumber = Number(budget)
    if (isNaN(budgetNumber) || budgetNumber < 50) {
      return res.status(400).json({
        error: 'Invalid budget',
        message: 'Minimum budget is ₹50'
      })
    }

    // Validate location exists
    if (!location || typeof location !== 'object') {
      return res.status(400).json({
        error: 'Invalid location',
        message: 'location must be an object'
      })
    }

    // Validate location.coordinates
    if (!location.coordinates) {
      return res.status(400).json({
        error: 'Invalid location',
        message: 'location.coordinates is required'
      })
    }

    if (!Array.isArray(location.coordinates)) {
      return res.status(400).json({
        error: 'Invalid coordinates',
        message: 'coordinates must be an array'
      })
    }

    if (location.coordinates.length !== 2) {
      return res.status(400).json({
        error: 'Invalid coordinates',
        message: 'coordinates must be an array of exactly 2 elements'
      })
    }

    // Validate coordinates are numbers, not strings
    const [longitude, latitude] = location.coordinates
    const lng = Number(longitude)
    const lat = Number(latitude)

    if (isNaN(lng) || isNaN(lat)) {
      return res.status(400).json({
        error: 'Invalid coordinates',
        message: 'coordinates must be numbers, not strings: [lng, lat]'
      })
    }

    // Geo coordinate sanity check
    if (lng < -180 || lng > 180) {
      return res.status(400).json({
        error: 'Invalid coordinates',
        message: 'coordinates must be [longitude, latitude]'
      })
    }

    if (lat < -90 || lat > 90) {
      return res.status(400).json({
        error: 'Invalid coordinates',
        message: 'coordinates must be [longitude, latitude]'
      })
    }

    // Normalize coordinates to ensure they are numbers
    const normalizedCoordinates = [Number(lng), Number(lat)]

    // Validate expectedDuration if provided
    let expectedDurationNumber = null
    if (expectedDuration !== undefined && expectedDuration !== null) {
      expectedDurationNumber = Number(expectedDuration)
      if (isNaN(expectedDurationNumber) || expectedDurationNumber <= 0) {
        return res.status(400).json({
          error: 'Invalid expectedDuration',
          message: 'expectedDuration must be a positive number (hours)'
        })
      }
    }

    // Expiry: every task must have an expiry so it stops showing after that
    let expiresAt = null
    if (expiresAtBody) {
      const d = new Date(expiresAtBody)
      if (!isNaN(d.getTime()) && d > new Date()) expiresAt = d
    }
    if (!expiresAt && validForDays != null) {
      const days = Number(validForDays)
      if (!isNaN(days) && days > 0) {
        const e = new Date()
        e.setDate(e.getDate() + Math.min(Math.floor(days), 14))
        e.setHours(23, 59, 59, 999)
        expiresAt = e
      }
    }
    if (!expiresAt) {
      const defaultExpiry = new Date()
      defaultExpiry.setDate(defaultExpiry.getDate() + 7)
      defaultExpiry.setHours(23, 59, 59, 999)
      expiresAt = defaultExpiry
    }

    const task = new Task({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      budget: budgetNumber,
      expectedDuration: expectedDurationNumber,
      expiresAt,
      isOnCampus: isOnCampus === true,
      location: {
        type: 'Point',
        coordinates: normalizedCoordinates,
        area: location.area ? location.area.trim() : null,
        city: location.city ? location.city.trim() : null,
        fullAddress: location.fullAddress ? location.fullAddress.trim() : null
      },
      postedBy: postedBy,
      status: 'OPEN',
      acceptedBy: null
    })

    const savedTask = await task.save()

    // Update user's task posting count and timestamp
    if (!userExists.lastActionTimestamps) {
      userExists.lastActionTimestamps = new Map()
    }
    userExists.lastActionTimestamps.set('createTask', new Date())
    await userExists.save()

    // Broadcast new task to eligible online workers
    try {
      const taskData = {
        taskId: savedTask._id.toString(),
        title: savedTask.title,
        category: savedTask.category,
        budget: savedTask.budget,
        isOnCampus: savedTask.isOnCampus === true,
        location: {
          area: savedTask.location.area,
          city: savedTask.location.city,
          coordinates: savedTask.location.coordinates
        },
        status: savedTask.status,
        createdAt: savedTask.createdAt ? savedTask.createdAt.toISOString() : new Date().toISOString()
      }

      // Set lastAlertedAt when task is created (for 3-hour cooldown)
      savedTask.lastAlertedAt = new Date()
      await savedTask.save()

      // Set lastAlertedAt when task is created (for 3-hour cooldown)
      savedTask.lastAlertedAt = new Date()
      await savedTask.save()

      // Pass postedBy to exclude task creator from receiving the notification
      broadcastNewTask(taskData, savedTask.postedBy.toString())
    } catch (broadcastError) {
      // Don't fail task creation if broadcast fails
    }

    return res.status(201).json({
      message: 'Task created successfully',
      task: savedTask
    })
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({
        error: 'Validation error',
        message: validationErrors.join(', '),
        details: error.errors
      })
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Duplicate entry',
        message: 'A task with this information already exists'
      })
    }

    // Generic server error
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while creating the task'
    })
  }
}

const acceptTask = async (req, res) => {
  try {
    const { taskId } = req.params
    const { workerId } = req.body

    // Validate taskId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        error: 'Invalid taskId',
        message: 'taskId must be a valid MongoDB ObjectId (24 hex characters)'
      })
    }

    // Validate workerId exists and is valid
    if (!workerId) {
      return res.status(400).json({
        error: 'Missing workerId',
        message: 'workerId is required in request body'
      })
    }

    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      return res.status(400).json({
        error: 'Invalid workerId',
        message: 'workerId must be a valid MongoDB ObjectId (24 hex characters)'
      })
    }

    // Validate worker exists in database
    const worker = await User.findById(workerId)
    if (!worker) {
      return res.status(400).json({
        error: 'Worker not found',
        message: 'workerId does not exist in database'
      })
    }

    // Check daily cancellation limit - block acceptance if limit reached
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const lastCancelDate = worker.lastCancelDate ? new Date(worker.lastCancelDate) : null
    let lastCancelDay = null
    if (lastCancelDate) {
      lastCancelDay = new Date(lastCancelDate)
      lastCancelDay.setHours(0, 0, 0, 0)
    }

    if (!lastCancelDay || lastCancelDay.getTime() !== today.getTime()) {
      // New day - reset counter (if needed)
      if (worker.dailyCancelCount > 0) {
        worker.dailyCancelCount = 0
        worker.lastCancelDate = today
        await worker.save()
      }
    }

    // Check if worker has reached daily cancellation limit
    const cancelLimit = worker.totalCancelLimit ?? 2 // Default to 2 if not set
    if (worker.dailyCancelCount >= cancelLimit) {
      return res.status(403).json({
        error: 'Daily cancellation limit reached',
        message: `You have reached today's cancellation limit (${cancelLimit}). You cannot accept new tasks.`
      })
    }

    // HARDENING CHECK 1: Worker must be ONLINE
    if (!socketManager.isWorkerOnline(workerId)) {
      return res.status(403).json({
        error: 'Worker offline',
        message: 'You must be online (ON DUTY) to accept tasks'
      })
    }

    // RAPID ACTION THROTTLING: Check if same action within 3 seconds
    const lastAcceptTimestamp = worker.lastActionTimestamps?.get('acceptTask')
    if (lastAcceptTimestamp) {
      const timeSinceLastAccept = Date.now() - new Date(lastAcceptTimestamp).getTime()
      if (timeSinceLastAccept < 3000) {
        return res.status(429).json({
          error: 'Too many requests',
          message: 'Please wait a moment before accepting another task.'
        })
      }
    }

    // HARDENING CHECK 2: Worker status must be active
    if (worker.status !== 'active') {
      return res.status(403).json({
        error: 'Worker account not active',
        message: 'Your account is not active. Please contact support.'
      })
    }

    // HARDENING CHECK 3: Worker must not have an active task
    const activeTask = await Task.findOne({
      acceptedBy: workerId,
      status: { $in: ['ACCEPTED', 'IN_PROGRESS'] }
    })

    if (activeTask) {
      return res.status(400).json({
        error: 'Active task exists',
        message: 'You already have an active task. Please complete or cancel it before accepting a new one.'
      })
    }

    // HARDENING CHECK 4: Fetch task and validate status and visibility
    const task = await Task.findOne({
      _id: taskId,
      status: { $in: ['OPEN', 'SEARCHING'] } // Support both for backward compatibility
    })

    // If task not found or not in OPEN/SEARCHING status, it means it was already accepted or doesn't exist
    if (!task) {
      return res.status(409).json({
        error: 'Task not available',
        message: 'This task has already been accepted, cancelled, or is not available'
      })
    }

    // HARDENING CHECK 5: Task must not be hidden
    if (task.isHidden) {
      return res.status(403).json({
        error: 'Task hidden',
        message: 'This task is not available'
      })
    }

    // HARDENING CHECK 6: Task must not be cancelled
    if (['CANCELLED', 'CANCELLED_BY_POSTER', 'CANCELLED_BY_WORKER', 'CANCELLED_BY_ADMIN'].includes(task.status)) {
      return res.status(400).json({
        error: 'Task cancelled',
        message: 'This task has been cancelled and is no longer available'
      })
    }

    // HARDENING CHECK 7: Block self-acceptance
    const postedById = task.postedBy.toString()
    const workerIdStr = workerId.toString()

    if (postedById === workerIdStr) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You cannot accept your own task'
      })
    }

    // ATOMIC ACCEPT (race-condition safe):
    // If 2+ workers accept the same task at once, only ONE can win. We use findOneAndUpdate
    // so the "read and update" is a single atomic operation in MongoDB. The first request
    // that matches (status OPEN/SEARCHING, no acceptedBy) updates the doc; the others get
    // no match and return 409 "Task already accepted".
    const updatedTask = await Task.findOneAndUpdate(
      {
        _id: taskId,
        status: { $in: ['OPEN', 'SEARCHING'] },
        $or: [{ acceptedBy: null }, { acceptedBy: { $exists: false } }], // No worker assigned yet
        isHidden: { $ne: true }
      },
      {
        $set: {
          status: 'ACCEPTED',
          acceptedBy: workerId,
          acceptedAt: new Date()
        }
      },
      {
        new: true, // Return updated document
        runValidators: true // Run schema validators
      }
    )

    // Double-check: If update failed (race condition), return conflict
    if (!updatedTask) {
      return res.status(409).json({
        error: 'Task already accepted',
        message: 'This task has already been accepted by another worker or is not available'
      })
    }

    // Update worker's last action timestamp
    if (!worker.lastActionTimestamps) {
      worker.lastActionTimestamps = new Map()
    }
    worker.lastActionTimestamps.set('acceptTask', new Date())
    await worker.save()

    // Create task chat (one chat per task; poster + worker only)
    try {
      await Chat.findOneAndUpdate(
        { taskId: updatedTask._id },
        {
          $setOnInsert: {
            taskId: updatedTask._id,
            participants: [updatedTask.postedBy, new mongoose.Types.ObjectId(workerIdStr)],
            messages: [],
            isActive: true
          }
        },
        { upsert: true, new: true }
      )
    } catch (chatErr) {
      // Don't fail accept if chat creation fails (e.g. duplicate)
    }

    // Emit real-time events (non-blocking)
    try {
      // Notify poster about task acceptance
      const posterId = updatedTask.postedBy.toString()
      notifyTaskAccepted(posterId, updatedTask._id, workerId)

      // Notify all other online workers to remove the task
      notifyTaskRemoved(workerId, updatedTask._id)

      // Emit taskUpdated event for state sync
      notifyTaskStatusChanged(posterId, taskId, 'ACCEPTED')
      notifyTaskStatusChanged(workerId, taskId, 'ACCEPTED')
    } catch (socketError) {
      // Don't fail the request if socket emission fails
    }

    return res.status(200).json({
      message: 'Task accepted successfully',
      task: updatedTask
    })
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({
        error: 'Validation error',
        message: validationErrors.join(', '),
        details: error.errors
      })
    }

    // Generic server error
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while accepting the task'
    })
  }
}

const getAvailableTasks = async (req, res) => {
  try {
    // Get worker location and filters from query params
    const workerLat = req.query.lat ? parseFloat(req.query.lat) : null
    const workerLng = req.query.lng ? parseFloat(req.query.lng) : null
    const radiusKm = req.query.radius ? parseFloat(req.query.radius) : 5
    const category = req.query.category && String(req.query.category).trim() ? String(req.query.category).trim() : null
    const minBudget = req.query.minBudget != null && req.query.minBudget !== '' ? Number(req.query.minBudget) : null
    const maxBudget = req.query.maxBudget != null && req.query.maxBudget !== '' ? Number(req.query.maxBudget) : null
    const search = req.query.search && String(req.query.search).trim() ? String(req.query.search).trim() : null
    const sort = req.query.sort ? String(req.query.sort) : 'distance'

    const now = new Date()
    const query = {
      status: { $in: ['OPEN', 'SEARCHING'] },
      isHidden: { $ne: true },
      isRecurringTemplate: { $ne: true },
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: now } }
      ]
    }
    if (category) query.category = category
    if (minBudget != null && !isNaN(minBudget) || maxBudget != null && !isNaN(maxBudget)) {
      query.budget = {}
      if (minBudget != null && !isNaN(minBudget)) query.budget.$gte = minBudget
      if (maxBudget != null && !isNaN(maxBudget)) query.budget.$lte = maxBudget
    }
    if (search) {
      query.$and = (query.$and || []).concat([
        { $or: [{ title: new RegExp(search, 'i') }, { description: new RegExp(search, 'i') }] }
      ])
    }

    let tasks = await Task.find(query).lean()

    // Calculate distances and filter if worker location is provided
    if (workerLat !== null && workerLng !== null && !isNaN(workerLat) && !isNaN(workerLng)) {
      // Validate worker coordinates
      if (workerLat < -90 || workerLat > 90 || workerLng < -180 || workerLng > 180) {
        return res.status(400).json({
          error: 'Invalid coordinates',
          message: 'Latitude must be between -90 and 90, longitude must be between -180 and 180'
        })
      }

      tasks = tasks.map(task => {
        if (task.location && task.location.coordinates && task.location.coordinates.length === 2) {
          try {
            const [taskLng, taskLat] = task.location.coordinates
            // Validate task coordinates
            if (isNaN(taskLat) || isNaN(taskLng) || taskLat < -90 || taskLat > 90 || taskLng < -180 || taskLng > 180) {
              return {
                ...task,
                distanceKm: null
              }
            }
            const distance = calculateDistance(workerLat, workerLng, taskLat, taskLng)
            return {
              ...task,
              distanceKm: distance
            }
          } catch (error) {
            return {
              ...task,
              distanceKm: null
            }
          }
        }
        return {
          ...task,
          distanceKm: null
        }
      })

      // Filter by radius
      tasks = tasks.filter(task => {
        if (task.distanceKm === null) return false // Exclude tasks without location
        return task.distanceKm <= radiusKm
      })

      // Sort: distance (default), budget_desc, budget_asc, newest
      if (sort === 'budget_desc') {
        tasks.sort((a, b) => (b.budget || 0) - (a.budget || 0))
      } else if (sort === 'budget_asc') {
        tasks.sort((a, b) => (a.budget || 0) - (b.budget || 0))
      } else if (sort === 'newest') {
        tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      } else {
        tasks.sort((a, b) => {
          if (a.distanceKm === null) return 1
          if (b.distanceKm === null) return -1
          return a.distanceKm - b.distanceKm
        })
      }
    } else {
      // No location provided - sort by createdAt (latest first) and set distanceKm to null
      tasks = tasks.map(task => ({
        ...task,
        distanceKm: null
      }))
      if (sort === 'budget_desc') tasks.sort((a, b) => (b.budget || 0) - (a.budget || 0))
      else if (sort === 'budget_asc') tasks.sort((a, b) => (a.budget || 0) - (b.budget || 0))
      else tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }

    return res.status(200).json({
      message: 'Tasks fetched successfully',
      count: tasks.length,
      tasks: tasks
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while fetching tasks'
    })
  }
}

const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params

    // Validate taskId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        error: 'Invalid taskId',
        message: 'taskId must be a valid MongoDB ObjectId (24 hex characters)'
      })
    }

    // Get worker location from query params (optional)
    const workerLat = req.query.lat ? parseFloat(req.query.lat) : null
    const workerLng = req.query.lng ? parseFloat(req.query.lng) : null

    // Fetch task from MongoDB by _id and populate postedBy and acceptedBy
    const task = await Task.findById(taskId)
      .populate('postedBy', 'name email phone')
      .populate('acceptedBy', 'name email phone')

    // If task not found, return 404
    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
        message: 'Task not found'
      })
    }

    // Get requester userId from query params (for authorization check)
    const requesterUserId = req.query.userId ? req.query.userId.toString() : null

    // Prepare response - conditionally include phone numbers
    const taskResponse = task.toObject()

    // Calculate distance if worker location is provided
    if (workerLat !== null && workerLng !== null && !isNaN(workerLat) && !isNaN(workerLng)) {
      // Validate worker coordinates
      if (workerLat < -90 || workerLat > 90 || workerLng < -180 || workerLng > 180) {
        taskResponse.distanceKm = null
      } else if (task.location && task.location.coordinates && task.location.coordinates.length === 2) {
        try {
          const [taskLng, taskLat] = task.location.coordinates
          // Validate task coordinates
          if (isNaN(taskLat) || isNaN(taskLng) || taskLat < -90 || taskLat > 90 || taskLng < -180 || taskLng > 180) {
            taskResponse.distanceKm = null
          } else {
            taskResponse.distanceKm = calculateDistance(workerLat, workerLng, taskLat, taskLng)
          }
        } catch (error) {
          taskResponse.distanceKm = null
        }
      } else {
        taskResponse.distanceKm = null
      }
    } else {
      taskResponse.distanceKm = null
    }

    // SECURE PHONE NUMBER SHARING:
    // Only include phone numbers if:
    // 1. Task is ACCEPTED or later
    // 2. AND requester is authorized (either the assigned worker OR the poster)

    const isTaskAccepted = task.status === 'ACCEPTED' || task.status === 'IN_PROGRESS' || task.status === 'COMPLETED'
    const isRequesterWorker = requesterUserId && task.acceptedBy && task.acceptedBy._id.toString() === requesterUserId
    const isRequesterPoster = requesterUserId && task.postedBy._id.toString() === requesterUserId

    // Initialize phone number fields
    taskResponse.posterPhone = null
    taskResponse.workerPhone = null

    if (isTaskAccepted) {
      // Worker can see poster's phone if they are the assigned worker
      if (isRequesterWorker && task.postedBy && task.postedBy.phone) {
        taskResponse.posterPhone = task.postedBy.phone
      }

      // Poster can see worker's phone if they are the task creator
      if (isRequesterPoster && task.acceptedBy && task.acceptedBy.phone) {
        taskResponse.workerPhone = task.acceptedBy.phone
      }
    }

    // Remove phone numbers from nested objects to prevent accidental exposure
    if (taskResponse.postedBy && taskResponse.postedBy.phone) {
      delete taskResponse.postedBy.phone
    }
    if (taskResponse.acceptedBy && taskResponse.acceptedBy.phone) {
      delete taskResponse.acceptedBy.phone
    }

    // Build location object explicitly so fullAddress is always included in the API response
    const loc = task.location || taskResponse.location
    taskResponse.location = {
      type: (loc && loc.type) || 'Point',
      coordinates: (loc && loc.coordinates) || null,
      area: (loc && loc.area) != null ? loc.area : null,
      city: (loc && loc.city) != null ? loc.city : null,
      fullAddress: (loc && loc.fullAddress != null && String(loc.fullAddress).trim() !== '')
        ? String(loc.fullAddress).trim()
        : null
    }

    return res.status(200).json({
      message: 'Task fetched successfully',
      task: taskResponse
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while fetching the task'
    })
  }
}

// GET /api/tasks/user/:userId - Fetch tasks posted by a specific user (with filters and search)
const getTasksByUser = async (req, res) => {
  try {
    const { userId } = req.params
    const { status, category, search, sort = 'date', dateFrom, dateTo } = req.query

    // Validate userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Invalid userId',
        message: 'userId must be a valid MongoDB ObjectId (24 hex characters)'
      })
    }

    const filter = { postedBy: userId }

    if (status) {
      const statuses = status.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
      if (statuses.length) filter.status = { $in: statuses }
    }
    if (category && String(category).trim()) {
      filter.category = new RegExp(String(category).trim(), 'i')
    }
    if (search && String(search).trim()) {
      const term = String(search).trim()
      filter.$or = [
        { title: new RegExp(term, 'i') },
        { description: new RegExp(term, 'i') }
      ]
    }
    if (dateFrom || dateTo) {
      filter.createdAt = {}
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom)
      if (dateTo) {
        const end = new Date(dateTo)
        end.setHours(23, 59, 59, 999)
        filter.createdAt.$lte = end
      }
    }

    let sortOption = { createdAt: -1 }
    if (sort === 'budget_asc') sortOption = { budget: 1, createdAt: -1 }
    else if (sort === 'budget_desc') sortOption = { budget: -1, createdAt: -1 }
    else if (sort === 'status') sortOption = { status: 1, createdAt: -1 }
    else if (sort === 'date') sortOption = { createdAt: -1 }

    const tasks = await Task.find(filter)
      .sort(sortOption)
      .lean()

    return res.status(200).json({
      message: 'Tasks fetched successfully',
      count: tasks.length,
      tasks: tasks
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while fetching tasks'
    })
  }
}

// POST /api/tasks/:taskId/cancel - Cancel a task
const cancelTask = async (req, res) => {
  try {
    const { taskId } = req.params
    const { userId, userRole } = req.body // userId and userRole (poster or worker)

    // Validate taskId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        error: 'Invalid taskId',
        message: 'taskId must be a valid MongoDB ObjectId (24 hex characters)'
      })
    }

    // Validate userId and userRole
    if (!userId || !userRole) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'userId and userRole are required'
      })
    }

    if (!['poster', 'worker'].includes(userRole)) {
      return res.status(400).json({
        error: 'Invalid userRole',
        message: 'userRole must be either "poster" or "worker"'
      })
    }

    // Fetch task
    const task = await Task.findById(taskId)
      .populate('postedBy', '_id')
      .populate('acceptedBy', '_id')

    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
        message: 'Task not found'
      })
    }

    // HARDENING: Check if task is already cancelled or completed
    if (['CANCELLED', 'CANCELLED_BY_POSTER', 'CANCELLED_BY_WORKER', 'CANCELLED_BY_ADMIN'].includes(task.status)) {
      return res.status(400).json({
        error: 'Task already cancelled',
        message: 'This task has already been cancelled'
      })
    }

    if (task.status === 'COMPLETED') {
      return res.status(400).json({
        error: 'Cannot cancel completed task',
        message: 'Completed tasks cannot be cancelled'
      })
    }

    // Poster cancellation rules
    if (userRole === 'poster') {
      // Verify user is the poster
      if (task.postedBy._id.toString() !== userId.toString()) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only the task poster can cancel this task'
        })
      }

      // HARDENING: Poster can cancel when status is OPEN, SEARCHING, ACCEPTED, or IN_PROGRESS (but not COMPLETED)
      if (['OPEN', 'SEARCHING', 'ACCEPTED', 'IN_PROGRESS'].includes(task.status)) {
        const updatedTask = await Task.findByIdAndUpdate(
          taskId,
          { $set: { status: 'CANCELLED_BY_POSTER' } },
          { new: true }
        )

        // Emit socket event to notify worker if task was accepted
        if (task.status === 'ACCEPTED' && task.acceptedBy) {
          try {
            const { notifyTaskCancelled } = require('../socket/socketHandler')
            notifyTaskCancelled(task.acceptedBy._id.toString(), taskId, 'poster')

            // Emit taskUpdated event for state sync
            notifyTaskStatusChanged(task.acceptedBy._id.toString(), taskId, 'CANCELLED_BY_POSTER')
          } catch (socketError) {
            // Don't fail if socket emit fails
          }
        }

        // Emit socket event to remove task from available tasks list
        try {
          notifyTaskRemoved(null, taskId) // Remove from all workers

          // Emit taskUpdated event for state sync
          notifyTaskStatusChanged(task.postedBy._id.toString(), taskId, 'CANCELLED_BY_POSTER')
        } catch (socketError) {
          // Don't fail if socket emit fails
        }

        return res.status(200).json({
          message: 'Task cancelled successfully',
          task: updatedTask
        })
      } else {
        return res.status(400).json({
          error: 'Cannot cancel task',
          message: 'Poster can only cancel tasks with status OPEN, SEARCHING, ACCEPTED, or IN_PROGRESS (but not COMPLETED)'
        })
      }
    }

    // Worker cancellation rules
    if (userRole === 'worker') {
      // Verify user is the accepted worker
      if (!task.acceptedBy || task.acceptedBy._id.toString() !== userId.toString()) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only the accepted worker can cancel this task'
        })
      }

      // Check daily cancellation limit for workers
      const worker = await User.findById(userId)
      if (!worker) {
        return res.status(404).json({
          error: 'Worker not found',
          message: 'Worker not found'
        })
      }

      // Check if it's a new day - reset counter if needed
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const lastCancelDate = worker.lastCancelDate ? new Date(worker.lastCancelDate) : null
      let lastCancelDay = null
      if (lastCancelDate) {
        lastCancelDay = new Date(lastCancelDate)
        lastCancelDay.setHours(0, 0, 0, 0)
      }

      if (!lastCancelDay || lastCancelDay.getTime() !== today.getTime()) {
        // New day - reset counter
        worker.dailyCancelCount = 0
        worker.lastCancelDate = today
        await worker.save()
      }

      // Check if worker has reached daily limit
      const cancelLimit = worker.totalCancelLimit ?? 2 // Default to 2 if not set
      if (worker.dailyCancelCount >= cancelLimit) {
        return res.status(403).json({
          error: 'Daily cancellation limit reached',
          message: `Daily cancellation limit reached (${cancelLimit}). You cannot cancel more tasks today.`
        })
      }

      // RAPID ACTION THROTTLING: Check if same action within 3 seconds
      const lastCancelTimestamp = worker.lastActionTimestamps?.get('cancelTask')
      if (lastCancelTimestamp) {
        const timeSinceLastCancel = Date.now() - new Date(lastCancelTimestamp).getTime()
        if (timeSinceLastCancel < 3000) {
          return res.status(429).json({
            error: 'Too many requests',
            message: 'Please wait a moment before cancelling again.'
          })
        }
      }

      // HARDENING: Worker can cancel when status is ACCEPTED or IN_PROGRESS (but not COMPLETED)
      if (task.status === 'ACCEPTED' || task.status === 'IN_PROGRESS') {
        // Update task: set status to OPEN and clear acceptedBy
        const updatedTask = await Task.findByIdAndUpdate(
          taskId,
          {
            $set: {
              status: 'CANCELLED_BY_WORKER',
              acceptedBy: null
            }
          },
          { new: true }
        )

        // Emit socket event to notify poster
        try {
          const { notifyTaskCancelled } = require('../socket/socketHandler')
          notifyTaskCancelled(task.postedBy._id.toString(), taskId, 'worker')

          // Emit taskUpdated event for state sync
          notifyTaskStatusChanged(task.postedBy._id.toString(), taskId, 'CANCELLED_BY_WORKER')
          notifyTaskStatusChanged(userId, taskId, 'CANCELLED_BY_WORKER')
        } catch (socketError) {
          // Don't fail if socket emit fails
        }

        // Increment daily cancellation count
        worker.dailyCancelCount += 1
        worker.lastCancelDate = new Date()

        // Update last action timestamp
        if (!worker.lastActionTimestamps) {
          worker.lastActionTimestamps = new Map()
        }
        worker.lastActionTimestamps.set('cancelTask', new Date())
        await worker.save()

        return res.status(200).json({
          message: 'Task cancellation successful. Task is now available for other workers.',
          task: updatedTask,
          remainingCancellations: Math.max(0, 2 - worker.dailyCancelCount)
        })
      } else {
        return res.status(400).json({
          error: 'Cannot cancel task',
          message: 'Worker can only cancel tasks with status ACCEPTED or IN_PROGRESS'
        })
      }
    }
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while cancelling the task'
    })
  }
}

// POST /api/tasks/:taskId/start - Worker starts the task (ACCEPTED → IN_PROGRESS)
const startTask = async (req, res) => {
  try {
    const { taskId } = req.params
    const { workerId } = req.body

    // Validate taskId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        error: 'Invalid taskId',
        message: 'taskId must be a valid MongoDB ObjectId'
      })
    }

    // Validate workerId
    if (!workerId || !mongoose.Types.ObjectId.isValid(workerId)) {
      return res.status(400).json({
        error: 'Invalid workerId',
        message: 'workerId is required and must be a valid MongoDB ObjectId'
      })
    }

    // Fetch task with populated acceptedBy
    const task = await Task.findById(taskId)
      .populate('acceptedBy', '_id')

    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
        message: 'Task not found'
      })
    }

    // Verify worker is the accepted worker
    if (!task.acceptedBy || task.acceptedBy._id.toString() !== workerId.toString()) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only the accepted worker can start this task'
      })
    }

    // HARDENING: Verify task status is ACCEPTED
    if (task.status !== 'ACCEPTED') {
      return res.status(400).json({
        error: 'Invalid status',
        message: `Task must be ACCEPTED to start. Current status: ${task.status}`
      })
    }

    // HARDENING: Verify task is not cancelled or hidden
    if (task.isHidden) {
      return res.status(403).json({
        error: 'Task hidden',
        message: 'This task is not available'
      })
    }

    if (['CANCELLED', 'CANCELLED_BY_POSTER', 'CANCELLED_BY_WORKER', 'CANCELLED_BY_ADMIN', 'COMPLETED'].includes(task.status)) {
      return res.status(400).json({
        error: 'Invalid task state',
        message: `Cannot start task with status: ${task.status}`
      })
    }

    // Update task to IN_PROGRESS with startedAt timestamp
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      {
        $set: {
          status: 'IN_PROGRESS',
          startedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    )

    // Notify both poster and worker about status change
    if (updatedTask.postedBy) {
      notifyTaskStatusChanged(updatedTask.postedBy.toString(), taskId, 'IN_PROGRESS')
    }
    if (updatedTask.acceptedBy) {
      notifyTaskStatusChanged(workerId.toString(), taskId, 'IN_PROGRESS')
    }

    // Emit taskUpdated event for state sync
    try {
      notifyTaskUpdated(taskId, {
        status: 'IN_PROGRESS',
        startedAt: updatedTask.startedAt,
        postedBy: updatedTask.postedBy,
        acceptedBy: updatedTask.acceptedBy
      })
    } catch (socketError) {
      // Don't fail if socket emit fails
    }

    return res.status(200).json({
      message: 'Task started successfully',
      task: updatedTask
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while starting the task'
    })
  }
}

// POST /api/tasks/:taskId/mark-complete - Worker marks task as complete (sets flag)
const markComplete = async (req, res) => {
  try {
    const { taskId } = req.params
    const { workerId } = req.body

    // Validate taskId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        error: 'Invalid taskId',
        message: 'taskId must be a valid MongoDB ObjectId'
      })
    }

    // Validate workerId
    if (!workerId || !mongoose.Types.ObjectId.isValid(workerId)) {
      return res.status(400).json({
        error: 'Invalid workerId',
        message: 'workerId is required and must be a valid MongoDB ObjectId'
      })
    }

    // Fetch task with populated acceptedBy
    const task = await Task.findById(taskId)
      .populate('acceptedBy', '_id')

    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
        message: 'Task not found'
      })
    }

    // Verify worker is the accepted worker
    if (!task.acceptedBy || task.acceptedBy._id.toString() !== workerId.toString()) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only the accepted worker can mark this task as complete'
      })
    }

    // HARDENING: Verify task status is IN_PROGRESS
    if (task.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        error: 'Invalid status',
        message: `Task must be IN_PROGRESS to mark as complete. Current status: ${task.status}`
      })
    }

    // HARDENING: Verify task is not cancelled or hidden
    if (task.isHidden) {
      return res.status(403).json({
        error: 'Task hidden',
        message: 'This task is not available'
      })
    }

    if (['CANCELLED', 'CANCELLED_BY_POSTER', 'CANCELLED_BY_WORKER', 'CANCELLED_BY_ADMIN', 'COMPLETED'].includes(task.status)) {
      return res.status(400).json({
        error: 'Invalid task state',
        message: `Cannot mark complete task with status: ${task.status}`
      })
    }

    // Check if already marked as complete
    if (task.workerCompleted) {
      return res.status(400).json({
        error: 'Already marked',
        message: 'Task has already been marked as complete by the worker'
      })
    }

    // Set workerCompleted flag (does NOT change status)
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      {
        $set: {
          workerCompleted: true
        }
      },
      { new: true, runValidators: true }
    )

    // Notify poster that worker marked task as complete
    if (updatedTask.postedBy) {
      notifyTaskStatusChanged(updatedTask.postedBy.toString(), taskId, 'IN_PROGRESS')
    }

    // Emit taskUpdated event for state sync
    try {
      notifyTaskUpdated(taskId, {
        status: 'IN_PROGRESS',
        workerCompleted: true,
        postedBy: updatedTask.postedBy,
        acceptedBy: updatedTask.acceptedBy
      })
    } catch (socketError) {
      // Don't fail if socket emit fails
    }

    return res.status(200).json({
      message: 'Task marked as complete by worker. Waiting for poster confirmation.',
      task: updatedTask
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while marking the task as complete'
    })
  }
}

// POST /api/tasks/:taskId/confirm-complete - Poster confirms completion (IN_PROGRESS → COMPLETED)
const confirmComplete = async (req, res) => {
  try {
    const { taskId } = req.params
    const { posterId } = req.body

    // Validate taskId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        error: 'Invalid taskId',
        message: 'taskId must be a valid MongoDB ObjectId'
      })
    }

    // Validate posterId
    if (!posterId || !mongoose.Types.ObjectId.isValid(posterId)) {
      return res.status(400).json({
        error: 'Invalid posterId',
        message: 'posterId is required and must be a valid MongoDB ObjectId'
      })
    }

    // Fetch task with populated postedBy
    const task = await Task.findById(taskId)
      .populate('postedBy', '_id')

    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
        message: 'Task not found'
      })
    }

    // Verify user is the task poster
    if (task.postedBy._id.toString() !== posterId.toString()) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only the task poster can confirm completion'
      })
    }

    // HARDENING: Verify task status is IN_PROGRESS
    if (task.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        error: 'Invalid status',
        message: `Task must be IN_PROGRESS to confirm completion. Current status: ${task.status}`
      })
    }

    // HARDENING: Verify task is not cancelled or hidden
    if (task.isHidden) {
      return res.status(403).json({
        error: 'Task hidden',
        message: 'This task is not available'
      })
    }

    if (['CANCELLED', 'CANCELLED_BY_POSTER', 'CANCELLED_BY_WORKER', 'CANCELLED_BY_ADMIN', 'COMPLETED'].includes(task.status)) {
      return res.status(400).json({
        error: 'Invalid task state',
        message: `Cannot confirm completion for task with status: ${task.status}`
      })
    }

    // Verify worker has marked it as complete
    if (!task.workerCompleted) {
      return res.status(400).json({
        error: 'Worker not completed',
        message: 'Worker has not marked this task as complete yet'
      })
    }

    // Update task to COMPLETED with completedAt timestamp
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      {
        $set: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    )

    // Notify both poster and worker about completion
    if (updatedTask.postedBy && updatedTask.acceptedBy) {
      notifyTaskCompleted(
        updatedTask.postedBy.toString(),
        updatedTask.acceptedBy.toString(),
        taskId
      )

      // Emit taskUpdated event for state sync
      notifyTaskStatusChanged(updatedTask.postedBy.toString(), taskId, 'COMPLETED')
      notifyTaskStatusChanged(updatedTask.acceptedBy.toString(), taskId, 'COMPLETED')

      try {
        notifyTaskUpdated(taskId, {
          status: 'COMPLETED',
          completedAt: updatedTask.completedAt,
          postedBy: updatedTask.postedBy,
          acceptedBy: updatedTask.acceptedBy
        })
      } catch (socketError) {
        // Don't fail if socket emit fails
      }
    }

    return res.status(200).json({
      message: 'Task completed successfully',
      task: updatedTask
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while confirming task completion'
    })
  }
}

// POST /api/tasks/:taskId/rate - Poster rates worker after task completion
const rateTask = async (req, res) => {
  try {
    const { taskId } = req.params
    const { rating, review, posterId } = req.body

    // Validate taskId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        error: 'Invalid taskId',
        message: 'taskId must be a valid MongoDB ObjectId'
      })
    }

    // Validate posterId
    if (!posterId || !mongoose.Types.ObjectId.isValid(posterId)) {
      return res.status(400).json({
        error: 'Invalid posterId',
        message: 'posterId is required and must be a valid MongoDB ObjectId'
      })
    }

    // Validate rating
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Invalid rating',
        message: 'Rating must be a number between 1 and 5'
      })
    }

    // Fetch task with populated postedBy and acceptedBy
    const task = await Task.findById(taskId)
      .populate('postedBy', '_id')
      .populate('acceptedBy', '_id')

    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
        message: 'Task not found'
      })
    }

    // Verify user is the task poster
    if (task.postedBy._id.toString() !== posterId.toString()) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only the task poster can rate this task'
      })
    }

    // Verify task is COMPLETED
    if (task.status !== 'COMPLETED') {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Task must be COMPLETED before rating. Current status: ' + task.status
      })
    }

    // Check if already rated
    if (task.rating) {
      return res.status(400).json({
        error: 'Already rated',
        message: 'This task has already been rated'
      })
    }

    // Verify task has an accepted worker
    if (!task.acceptedBy) {
      return res.status(400).json({
        error: 'No worker',
        message: 'Task does not have an accepted worker to rate'
      })
    }

    // Update task with rating
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      {
        $set: {
          rating: rating,
          review: review || null,
          ratedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    )

    // Recalculate worker's average rating
    const workerId = task.acceptedBy._id
    const completedTasks = await Task.find({
      acceptedBy: workerId,
      status: 'COMPLETED',
      rating: { $exists: true, $ne: null }
    })

    const totalRatings = completedTasks.length
    const sumRatings = completedTasks.reduce((sum, t) => sum + (t.rating || 0), 0)
    const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0

    // Update worker's rating stats
    await User.findByIdAndUpdate(workerId, {
      $set: {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalRatings: totalRatings
      }
    })

    return res.status(200).json({
      message: 'Rating submitted successfully',
      task: updatedTask
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while submitting the rating'
    })
  }
}

// PUT /api/tasks/:taskId/edit - Poster edits their task
const editTask = async (req, res) => {
  try {
    const { taskId } = req.params
    const { posterId, title, description, category, budget, location, scheduledAt, expectedDuration, expiresAt: expiresAtBody, validForDays, shouldReAlert } = req.body

    // Validate taskId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        error: 'Invalid taskId',
        message: 'taskId must be a valid MongoDB ObjectId'
      })
    }

    // Validate posterId
    if (!posterId || !mongoose.Types.ObjectId.isValid(posterId)) {
      return res.status(400).json({
        error: 'Invalid posterId',
        message: 'posterId is required and must be a valid MongoDB ObjectId'
      })
    }

    // Fetch task
    const task = await Task.findById(taskId)
      .populate('postedBy', '_id')

    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
        message: 'Task not found'
      })
    }

    // Verify user is the task poster
    if (task.postedBy._id.toString() !== posterId.toString()) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only the task poster can edit this task'
      })
    }

    const isLimitedEdit = ['ACCEPTED', 'IN_PROGRESS'].includes(task.status)
    // Limited edit (ACCEPTED/IN_PROGRESS): only budget, expiresAt, validForDays
    if (isLimitedEdit) {
      const updateData = {}
      if (budget !== undefined) {
        const budgetNumber = Number(budget)
        if (isNaN(budgetNumber) || budgetNumber < 50) {
          return res.status(400).json({
            error: 'Invalid budget',
            message: 'Minimum budget is ₹50'
          })
        }
        updateData.budget = budgetNumber
      }
      let expiresAt = null
      if (expiresAtBody) {
        const d = new Date(expiresAtBody)
        if (!isNaN(d.getTime()) && d > new Date()) expiresAt = d
      }
      if (!expiresAt && validForDays != null) {
        const days = Number(validForDays)
        if (!isNaN(days) && days > 0) {
          const e = new Date()
          e.setDate(e.getDate() + Math.min(Math.floor(days), 14))
          expiresAt = e
        }
      }
      if (expiresAt) updateData.expiresAt = expiresAt

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'Nothing to update',
          message: 'Provide budget and/or expiresAt/validForDays to update'
        })
      }

      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        { $set: updateData },
        { new: true, runValidators: true }
      )

      let shouldAlert = false
      if (shouldReAlert === true && updateData.budget != null) {
        const now = new Date()
        const lastAlerted = task.lastAlertedAt ? new Date(task.lastAlertedAt) : null
        const threeHoursInMs = 3 * 60 * 60 * 1000
        if (!lastAlerted || (now - lastAlerted) >= threeHoursInMs) {
          shouldAlert = true
          updatedTask.lastAlertedAt = now
          await updatedTask.save()
        }
      }
      if (shouldAlert) {
        try {
          broadcastNewTask({
            taskId: updatedTask._id.toString(),
            title: updatedTask.title,
            category: updatedTask.category,
            budget: updatedTask.budget,
            location: updatedTask.location,
            createdAt: updatedTask.createdAt
          }, posterId)
        } catch (socketError) { }
      }
      try {
        notifyTaskUpdated(taskId, { status: updatedTask.status, budget: updatedTask.budget, expiresAt: updatedTask.expiresAt, postedBy: updatedTask.postedBy, acceptedBy: updatedTask.acceptedBy })
        notifyTaskStatusChanged(posterId, taskId, updatedTask.status)
      } catch (socketError) { }
      return res.status(200).json({
        message: 'Task updated successfully',
        task: updatedTask,
        reAlerted: shouldAlert
      })
    }

    // Full edit: only for OPEN or SEARCHING
    if (!['OPEN', 'SEARCHING'].includes(task.status)) {
      return res.status(400).json({
        error: 'Cannot edit task',
        message: 'Tasks can only be fully edited when status is OPEN or SEARCHING. Current status: ' + task.status
      })
    }

    // Build update object with only provided fields
    const updateData = {}
    if (title !== undefined) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description.trim()
    if (category !== undefined) updateData.category = category
    if (budget !== undefined) {
      const budgetNumber = Number(budget)
      if (isNaN(budgetNumber) || budgetNumber < 50) {
        return res.status(400).json({
          error: 'Invalid budget',
          message: 'Minimum budget is ₹50'
        })
      }
      updateData.budget = budgetNumber
    }
    if (location !== undefined) {
      if (!location.coordinates || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
        return res.status(400).json({
          error: 'Invalid location',
          message: 'location.coordinates must be an array of [longitude, latitude]'
        })
      }
      updateData.location = {
        type: 'Point',
        coordinates: location.coordinates,
        area: location.area || task.location?.area,
        city: location.city || task.location?.city,
        fullAddress: location.fullAddress !== undefined ? (location.fullAddress ? location.fullAddress.trim() : null) : task.location?.fullAddress
      }
    }
    if (scheduledAt !== undefined) {
      updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null
    }
    if (expectedDuration !== undefined) {
      updateData.expectedDuration = expectedDuration ? Number(expectedDuration) : null
    }
    // Extend validity
    if (expiresAtBody !== undefined) {
      const d = new Date(expiresAtBody)
      if (!isNaN(d.getTime()) && d > new Date()) updateData.expiresAt = d
    }
    if (validForDays != null) {
      const days = Number(validForDays)
      if (!isNaN(days) && days > 0) {
        const e = new Date()
        e.setDate(e.getDate() + Math.min(Math.floor(days), 14))
        updateData.expiresAt = e
      }
    }

    // Update task
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $set: updateData },
      { new: true, runValidators: true }
    )

    // Check if we should re-alert workers (only if shouldReAlert is true AND 3+ hours have passed since last alert)
    let shouldAlert = false
    if (shouldReAlert === true) {
      const now = new Date()
      const lastAlerted = task.lastAlertedAt ? new Date(task.lastAlertedAt) : null
      const threeHoursInMs = 3 * 60 * 60 * 1000 // 3 hours

      if (!lastAlerted || (now - lastAlerted) >= threeHoursInMs) {
        shouldAlert = true
        // Update lastAlertedAt
        updatedTask.lastAlertedAt = now
        await updatedTask.save()
      }
    }

    // Re-alert workers if conditions are met
    if (shouldAlert) {
      try {
        broadcastNewTask({
          taskId: updatedTask._id.toString(),
          title: updatedTask.title,
          category: updatedTask.category,
          budget: updatedTask.budget,
          location: updatedTask.location,
          createdAt: updatedTask.createdAt
        }, posterId)
      } catch (socketError) { }
    }

    // Emit taskUpdated event for state sync
    try {
      notifyTaskUpdated(taskId, {
        status: updatedTask.status,
        title: updatedTask.title,
        budget: updatedTask.budget,
        postedBy: updatedTask.postedBy,
        acceptedBy: updatedTask.acceptedBy
      })
      notifyTaskStatusChanged(posterId, taskId, updatedTask.status)
    } catch (socketError) {
      // Don't fail if socket emit fails
    }

    return res.status(200).json({
      message: 'Task updated successfully',
      task: updatedTask,
      reAlerted: shouldAlert
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while editing the task'
    })
  }
}

// DELETE /api/tasks/:taskId - Poster deletes their task
const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params
    const { posterId } = req.body

    // Validate taskId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        error: 'Invalid taskId',
        message: 'taskId must be a valid MongoDB ObjectId'
      })
    }

    // Validate posterId
    if (!posterId || !mongoose.Types.ObjectId.isValid(posterId)) {
      return res.status(400).json({
        error: 'Invalid posterId',
        message: 'posterId is required and must be a valid MongoDB ObjectId'
      })
    }

    // Fetch task
    const task = await Task.findById(taskId)
      .populate('postedBy', '_id')
      .populate('acceptedBy', '_id')

    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
        message: 'Task not found'
      })
    }

    // Verify user is the task poster
    if (task.postedBy._id.toString() !== posterId.toString()) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only the task poster can delete this task'
      })
    }

    // HARDENING: Can only delete tasks that are OPEN or SEARCHING (not accepted/in progress/completed)
    if (!['OPEN', 'SEARCHING'].includes(task.status)) {
      return res.status(400).json({
        error: 'Cannot delete task',
        message: 'Tasks can only be deleted when status is OPEN or SEARCHING. Current status: ' + task.status
      })
    }

    // Delete task
    await Task.findByIdAndDelete(taskId)

    // Emit socket events to notify workers
    try {
      notifyTaskRemoved(null, taskId) // Remove from all workers
      notifyTaskStatusChanged(posterId, taskId, 'DELETED')
    } catch (socketError) {
      // Don't fail if socket emit fails
    }

    return res.status(200).json({
      message: 'Task deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while deleting the task'
    })
  }
}

// POST /api/tasks/:taskId/duplicate - Poster duplicates a task (creates new OPEN task with same details)
const duplicateTask = async (req, res) => {
  try {
    const { taskId } = req.params
    const { posterId } = req.body

    if (!mongoose.Types.ObjectId.isValid(taskId) || !posterId || !mongoose.Types.ObjectId.isValid(posterId)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'taskId and posterId are required and must be valid ObjectIds'
      })
    }

    const task = await Task.findById(taskId).populate('postedBy', '_id').lean()
    if (!task) {
      return res.status(404).json({ error: 'Task not found', message: 'Task not found' })
    }
    if (task.postedBy._id.toString() !== posterId.toString()) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only the task poster can duplicate this task'
      })
    }

    const expiresAt = task.expiresAt && new Date(task.expiresAt) > new Date()
      ? new Date(task.expiresAt)
      : (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d })()

    const newTask = await Task.create({
      title: task.title,
      description: task.description,
      category: task.category,
      budget: task.budget,
      location: task.location,
      postedBy: posterId,
      status: 'OPEN',
      scheduledAt: task.scheduledAt ? new Date(task.scheduledAt) : null,
      expectedDuration: task.expectedDuration || null,
      expiresAt
    })

    try {
      broadcastNewTask({
        taskId: newTask._id.toString(),
        title: newTask.title,
        category: newTask.category,
        budget: newTask.budget,
        location: newTask.location,
        createdAt: newTask.createdAt
      }, posterId)
    } catch (socketError) { }

    return res.status(201).json({
      message: 'Task duplicated successfully',
      task: newTask
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while duplicating the task'
    })
  }
}

// POST /api/tasks/bulk-cancel - Poster cancels multiple tasks
const bulkCancelTasks = async (req, res) => {
  try {
    const { posterId, taskIds } = req.body
    if (!posterId || !mongoose.Types.ObjectId.isValid(posterId) || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'posterId and taskIds (array) are required'
      })
    }

    const validIds = taskIds.filter(id => mongoose.Types.ObjectId.isValid(id))
    const tasks = await Task.find({ _id: { $in: validIds }, postedBy: posterId })
    const cancellable = tasks.filter(t => ['OPEN', 'SEARCHING', 'ACCEPTED', 'IN_PROGRESS'].includes(t.status))

    for (const task of cancellable) {
      await Task.findByIdAndUpdate(task._id, { $set: { status: 'CANCELLED_BY_POSTER' } })
      if (task.status === 'ACCEPTED' && task.acceptedBy) {
        try {
          notifyTaskCancelled(task.acceptedBy.toString(), task._id.toString(), 'poster')
          notifyTaskStatusChanged(task.acceptedBy.toString(), task._id.toString(), 'CANCELLED_BY_POSTER')
        } catch (e) { }
      }
    }

    return res.status(200).json({
      message: 'Bulk cancel completed',
      cancelled: cancellable.length,
      totalRequested: validIds.length
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while cancelling tasks'
    })
  }
}

// POST /api/tasks/bulk-extend-validity - Poster extends validity for multiple OPEN/SEARCHING tasks
const bulkExtendValidity = async (req, res) => {
  try {
    const { posterId, taskIds, validForDays = 7 } = req.body
    if (!posterId || !mongoose.Types.ObjectId.isValid(posterId) || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'posterId and taskIds (array) are required'
      })
    }
    const days = Math.max(1, Math.min(14, Number(validForDays) || 7))
    const validIds = taskIds.filter(id => mongoose.Types.ObjectId.isValid(id))
    const result = await Task.updateMany(
      { _id: { $in: validIds }, postedBy: posterId, status: { $in: ['OPEN', 'SEARCHING'] } },
      { $set: { expiresAt: (() => { const d = new Date(); d.setDate(d.getDate() + days); return d })() } }
    )

    return res.status(200).json({
      message: 'Bulk extend validity completed',
      modified: result.modifiedCount,
      totalRequested: validIds.length
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while extending validity'
    })
  }
}

// POST /api/tasks/bulk-delete - Poster deletes multiple OPEN/SEARCHING tasks
const bulkDeleteTasks = async (req, res) => {
  try {
    const { posterId, taskIds } = req.body
    if (!posterId || !mongoose.Types.ObjectId.isValid(posterId) || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'posterId and taskIds (array) are required'
      })
    }
    const validIds = taskIds.filter(id => mongoose.Types.ObjectId.isValid(id))
    const deleted = await Task.deleteMany({
      _id: { $in: validIds },
      postedBy: posterId,
      status: { $in: ['OPEN', 'SEARCHING'] }
    })

    try {
      validIds.forEach(tid => notifyTaskRemoved(null, tid))
    } catch (e) { }

    return res.status(200).json({
      message: 'Bulk delete completed',
      deleted: deleted.deletedCount,
      totalRequested: validIds.length
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while deleting tasks'
    })
  }
}

// PATCH /api/tasks/:taskId/recurring - Poster sets/updates recurring schedule or pause
const setRecurringSchedule = async (req, res) => {
  try {
    const { taskId } = req.params
    const { posterId, frequency = 'weekly', paused = false } = req.body

    if (!mongoose.Types.ObjectId.isValid(taskId) || !posterId || !mongoose.Types.ObjectId.isValid(posterId)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'taskId and posterId are required and must be valid ObjectIds'
      })
    }
    const freq = ['daily', 'weekly', 'monthly'].includes(frequency) ? frequency : 'weekly'

    const task = await Task.findById(taskId).populate('postedBy', '_id')
    if (!task) return res.status(404).json({ error: 'Task not found', message: 'Task not found' })
    if (task.postedBy._id.toString() !== posterId.toString()) {
      return res.status(403).json({ error: 'Forbidden', message: 'Only the task poster can set recurring' })
    }
    if (!['OPEN', 'SEARCHING'].includes(task.status)) {
      return res.status(400).json({
        error: 'Cannot set recurring',
        message: 'Only OPEN or SEARCHING tasks can be set as recurring templates'
      })
    }

    const now = new Date()
    let nextRunAt = task.recurringSchedule?.nextRunAt ? new Date(task.recurringSchedule.nextRunAt) : null
    if (!nextRunAt || nextRunAt <= now) {
      if (freq === 'daily') nextRunAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      else if (freq === 'weekly') nextRunAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      else nextRunAt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
    }

    await Task.findByIdAndUpdate(taskId, {
      $set: {
        isRecurringTemplate: true,
        'recurringSchedule.frequency': freq,
        'recurringSchedule.nextRunAt': nextRunAt,
        'recurringSchedule.paused': !!paused
      }
    })

    const updated = await Task.findById(taskId).lean()
    return res.status(200).json({
      message: paused ? 'Recurring paused' : 'Recurring schedule updated',
      task: updated
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while setting recurring'
    })
  }
}

// Run recurring job: create tasks from templates where nextRunAt <= now and !paused
const runRecurringTasks = async () => {
  try {
    const now = new Date()
    const templates = await Task.find({
      isRecurringTemplate: true,
      'recurringSchedule.paused': false,
      'recurringSchedule.nextRunAt': { $lte: now }
    }).lean()

    for (const t of templates) {
      try {
        const expiresAt = t.expiresAt && new Date(t.expiresAt) > now
          ? new Date(t.expiresAt)
          : (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d })()
        await Task.create({
          title: t.title,
          description: t.description,
          category: t.category,
          budget: t.budget,
          location: t.location,
          postedBy: t.postedBy,
          status: 'OPEN',
          scheduledAt: t.scheduledAt ? new Date(t.scheduledAt) : null,
          expectedDuration: t.expectedDuration || null,
          expiresAt,
          sourceTemplateId: t._id
        })

        const freq = t.recurringSchedule?.frequency || 'weekly'
        let next = new Date(t.recurringSchedule.nextRunAt || now)
        if (freq === 'daily') next.setDate(next.getDate() + 1)
        else if (freq === 'weekly') next.setDate(next.getDate() + 7)
        else next = new Date(next.getFullYear(), next.getMonth() + 1, next.getDate())

        await Task.findByIdAndUpdate(t._id, {
          $set: { 'recurringSchedule.nextRunAt': next }
        })
      } catch (err) {
        // log and continue with next template
      }
    }
  } catch (error) {
    // log
  }
}

// GET /api/tasks/user/:userId/analytics - Poster task analytics summary
const getPosterTaskAnalytics = async (req, res) => {
  try {
    const { userId } = req.params
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Invalid userId',
        message: 'userId must be a valid MongoDB ObjectId'
      })
    }

    const tasks = await Task.find({ postedBy: userId }).lean()
    const openOrSearching = tasks.filter(t => ['OPEN', 'SEARCHING'].includes(t.status))
    const accepted = tasks.filter(t => t.status === 'ACCEPTED' || t.status === 'IN_PROGRESS')
    const completed = tasks.filter(t => t.status === 'COMPLETED')
    const cancelled = tasks.filter(t => ['CANCELLED', 'CANCELLED_BY_POSTER', 'CANCELLED_BY_WORKER', 'CANCELLED_BY_ADMIN'].includes(t.status))

    let totalViewCount = 0
    let totalTimeToAcceptanceMs = 0
    let acceptedCount = 0
    tasks.forEach(t => {
      if (t.viewCount) totalViewCount += t.viewCount
      if (t.acceptedAt && t.createdAt) {
        totalTimeToAcceptanceMs += new Date(t.acceptedAt) - new Date(t.createdAt)
        acceptedCount += 1
      }
    })
    const avgTimeToAcceptanceMs = acceptedCount > 0 ? totalTimeToAcceptanceMs / acceptedCount : null
    const completedCount = completed.length
    const totalAcceptedForCompletion = accepted.length + completedCount
    const completionRate = totalAcceptedForCompletion > 0 ? (completedCount / totalAcceptedForCompletion) * 100 : 0

    return res.status(200).json({
      message: 'Analytics fetched successfully',
      analytics: {
        totalTasks: tasks.length,
        openOrSearching: openOrSearching.length,
        inProgress: accepted.length,
        completed: completedCount,
        cancelled: cancelled.length,
        totalViewCount,
        averageTimeToAcceptanceMs: avgTimeToAcceptanceMs,
        completionRatePercent: Math.round(completionRate * 10) / 10
      }
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while fetching analytics'
    })
  }
}

module.exports = {
  createTask,
  acceptTask,
  getAvailableTasks,
  getTaskById,
  getTasksByUser,
  cancelTask,
  startTask,
  markComplete,
  confirmComplete,
  rateTask,
  editTask,
  deleteTask,
  duplicateTask,
  bulkCancelTasks,
  bulkExtendValidity,
  bulkDeleteTasks,
  getPosterTaskAnalytics,
  setRecurringSchedule,
  runRecurringTasks
}
