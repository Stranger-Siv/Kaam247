const User = require('../models/User')
const Task = require('../models/Task')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const createUser = async (req, res) => {
  try {
    const { name, email, phone, password, location, roleMode, role } = req.body

    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Please provide: name, email, and phone'
      })
    }

    // Hash password if provided, otherwise generate a temporary one
    let userPassword
    if (password) {
      const salt = await bcrypt.genSalt(10)
      userPassword = await bcrypt.hash(password, salt)
    } else {
      // Generate a temporary password for testing purposes
      const salt = await bcrypt.genSalt(10)
      userPassword = await bcrypt.hash('temp_password_' + Date.now(), salt)
    }

    // Validate location if provided
    let userLocation = null
    if (location && location.coordinates) {
      if (!Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
        return res.status(400).json({
          error: 'Invalid location',
          message: 'location.coordinates must be [longitude, latitude]'
        })
      }

      const [lng, lat] = location.coordinates
      const longitude = Number(lng)
      const latitude = Number(lat)

      if (isNaN(longitude) || isNaN(latitude)) {
        return res.status(400).json({
          error: 'Invalid coordinates',
          message: 'coordinates must be numbers'
        })
      }

      if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
        return res.status(400).json({
          error: 'Invalid coordinates',
          message: 'coordinates must be [longitude, latitude]'
        })
      }

      userLocation = {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
        area: location.area || null,
        city: location.city || null
      }
    }

    // Create user
    // Note: role = 'user' | 'admin' (admin set manually in DB)
    // roleMode = 'worker' | 'poster' (user's mode in the app)
    const user = new User({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password: userPassword, // Will be hashed in production
      location: userLocation,
      role: role || 'user', // Default to 'user' (admin set manually in DB)
      roleMode: roleMode || 'worker' // User mode: worker or poster
    })

    const savedUser = await user.save()

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        _id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        roleMode: savedUser.roleMode
      }
    })
  } catch (error) {
    console.error('Error creating user:', error)
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({
        error: 'Validation error',
        message: validationErrors.join(', ')
      })
    }

    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Duplicate email',
        message: 'A user with this email already exists'
      })
    }

    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while creating the user'
    })
  }
}

// PUT /api/users/me - Update authenticated user's profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.userId // From auth middleware
    const { name, phone, profilePhoto, location } = req.body

    // Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Invalid userId',
        message: 'User ID is required'
      })
    }

    // Find user
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      })
    }

    // Build update object
    const updateData = {}
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          error: 'Invalid name',
          message: 'Name cannot be empty'
        })
      }
      updateData.name = name.trim()
    }

    if (phone !== undefined) {
      if (!phone || phone.trim().length === 0) {
        return res.status(400).json({
          error: 'Invalid phone',
          message: 'Phone cannot be empty'
        })
      }
      // Check if phone is already taken by another user
      const existingUser = await User.findOne({ phone: phone.trim(), _id: { $ne: userId } })
      if (existingUser) {
        return res.status(400).json({
          error: 'Phone already exists',
          message: 'This phone number is already registered'
        })
      }
      updateData.phone = phone.trim()
    }

    if (profilePhoto !== undefined) {
      updateData.profilePhoto = profilePhoto || null
    }

    // Handle location update
    if (location !== undefined) {
      if (location === null) {
        // Clear location
        updateData.location = null
      } else if (location.lat !== undefined && location.lng !== undefined) {
        // Validate coordinates
        const lat = Number(location.lat)
        const lng = Number(location.lng)

        if (isNaN(lat) || isNaN(lng)) {
          return res.status(400).json({
            error: 'Invalid coordinates',
            message: 'Latitude and longitude must be numbers'
          })
        }

        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          return res.status(400).json({
            error: 'Invalid coordinates',
            message: 'Latitude must be between -90 and 90, longitude between -180 and 180'
          })
        }

        // Update location (MongoDB GeoJSON format: [longitude, latitude])
        updateData.location = {
          type: 'Point',
          coordinates: [lng, lat], // MongoDB uses [longitude, latitude]
          area: location.area || user.location?.area || null,
          city: location.city || user.location?.city || null
        }
      } else {
        return res.status(400).json({
          error: 'Invalid location',
          message: 'Location must have lat and lng properties'
        })
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password')

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Duplicate field',
        message: 'This phone number is already registered'
      })
    }

    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while updating profile'
    })
  }
}

// GET /api/users/me/activity - Get user's activity history
const getActivity = async (req, res) => {
  try {
    const userId = req.userId // From auth middleware

    // Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Invalid userId',
        message: 'User ID is required'
      })
    }

    // Fetch all tasks where user is either poster or worker
    const postedTasks = await Task.find({ postedBy: userId })
      .populate('acceptedBy', 'name')
      .sort({ createdAt: -1 })
      .lean()

    const acceptedTasks = await Task.find({ acceptedBy: userId })
      .populate('postedBy', 'name')
      .sort({ createdAt: -1 })
      .lean()

    // Categorize tasks
    const categorized = {
      posted: postedTasks.map(task => ({
        id: task._id,
        title: task.title,
        category: task.category,
        budget: task.budget,
        status: task.status,
        workerCompleted: task.workerCompleted || false,
        role: 'Poster',
        date: task.createdAt,
        acceptedBy: task.acceptedBy?.name || null,
        acceptedById: task.acceptedBy?._id || null,
        completedAt: task.completedAt || null
      })),
      accepted: acceptedTasks.map(task => ({
        id: task._id,
        title: task.title,
        category: task.category,
        budget: task.budget,
        status: task.status,
        role: 'Worker',
        date: task.createdAt,
        postedBy: task.postedBy?.name || null,
        completedAt: task.completedAt || null,
        rating: task.rating || null
      })),
      completed: [
        ...postedTasks.filter(t => t.status === 'COMPLETED'),
        ...acceptedTasks.filter(t => t.status === 'COMPLETED')
      ].map(task => ({
        id: task._id,
        title: task.title,
        category: task.category,
        budget: task.budget,
        status: task.status,
        role: task.postedBy?._id?.toString() === userId ? 'Poster' : 'Worker',
        date: task.completedAt || task.createdAt,
        postedBy: task.postedBy?.name || null,
        acceptedBy: task.acceptedBy?.name || null,
        rating: task.rating || null
      })).sort((a, b) => new Date(b.date) - new Date(a.date)),
      cancelled: [
        ...postedTasks.filter(t => t.status === 'CANCELLED'),
        ...acceptedTasks.filter(t => t.status === 'CANCELLED')
      ].map(task => ({
        id: task._id,
        title: task.title,
        category: task.category,
        budget: task.budget,
        status: task.status,
        role: task.postedBy?._id?.toString() === userId ? 'Poster' : 'Worker',
        date: task.createdAt,
        postedBy: task.postedBy?.name || null,
        acceptedBy: task.acceptedBy?.name || null
      })).sort((a, b) => new Date(b.date) - new Date(a.date))
    }

    return res.status(200).json({
      message: 'Activity fetched successfully',
      activity: categorized
    })
  } catch (error) {
    console.error('Error fetching activity:', error)
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while fetching activity'
    })
  }
}

// GET /api/users/me/earnings - Get worker's earnings
const getEarnings = async (req, res) => {
  try {
    const userId = req.userId // From auth middleware

    // Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: 'Invalid userId',
        message: 'User ID is required'
      })
    }

    // Fetch all completed tasks where user is the worker
    const completedTasks = await Task.find({
      acceptedBy: userId,
      status: 'COMPLETED'
    })
      .populate('postedBy', 'name')
      .sort({ completedAt: -1 })
      .lean()

    // Calculate total earnings
    const totalEarnings = completedTasks.reduce((sum, task) => sum + (task.budget || 0), 0)

    // Calculate earnings by time period
    const now = new Date()
    
    // Today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayTasks = completedTasks.filter(task => {
      const completedDate = task.completedAt ? new Date(task.completedAt) : new Date(task.createdAt)
      return completedDate >= startOfToday
    })
    const earningsToday = todayTasks.reduce((sum, task) => sum + (task.budget || 0), 0)

    // This week (last 7 days)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - 7)
    const weekTasks = completedTasks.filter(task => {
      const completedDate = task.completedAt ? new Date(task.completedAt) : new Date(task.createdAt)
      return completedDate >= startOfWeek
    })
    const earningsThisWeek = weekTasks.reduce((sum, task) => sum + (task.budget || 0), 0)

    // This month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthTasks = completedTasks.filter(task => {
      const completedDate = task.completedAt ? new Date(task.completedAt) : new Date(task.createdAt)
      return completedDate >= startOfMonth
    })
    const earningsThisMonth = thisMonthTasks.reduce((sum, task) => sum + (task.budget || 0), 0)

    // Format task list
    const taskList = completedTasks.map(task => ({
      id: task._id,
      title: task.title,
      category: task.category,
      budget: task.budget,
      completedAt: task.completedAt || task.createdAt,
      postedBy: task.postedBy?.name || 'User',
      rating: task.rating || null
    }))

    return res.status(200).json({
      message: 'Earnings fetched successfully',
      earnings: {
        total: totalEarnings,
        today: earningsToday,
        thisWeek: earningsThisWeek,
        thisMonth: earningsThisMonth,
        totalTasks: completedTasks.length,
        tasks: taskList
      }
    })
  } catch (error) {
    console.error('Error fetching earnings:', error)
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while fetching earnings'
    })
  }
}

// GET /api/users/me - Get current user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.userId // From auth middleware

    const user = await User.findById(userId).select('-password')
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      })
    }

    return res.status(200).json({
      message: 'Profile fetched successfully',
      user: user
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while fetching profile'
    })
  }
}

// GET /api/users/me/cancellation-status - Get worker's daily cancellation status
const getCancellationStatus = async (req, res) => {
  try {
    const userId = req.userId // From auth middleware

    const user = await User.findById(userId).select('dailyCancelCount lastCancelDate role')
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      })
    }

    // Check if it's a new day - reset counter if needed
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const lastCancelDate = user.lastCancelDate ? new Date(user.lastCancelDate) : null
    let lastCancelDay = null
    if (lastCancelDate) {
      lastCancelDay = new Date(lastCancelDate)
      lastCancelDay.setHours(0, 0, 0, 0)
    }

    if (!lastCancelDay || lastCancelDay.getTime() !== today.getTime()) {
      // New day - reset counter
      if (user.dailyCancelCount > 0) {
        user.dailyCancelCount = 0
        user.lastCancelDate = today
        await user.save()
      }
    }

    const remainingCancellations = Math.max(0, 2 - user.dailyCancelCount)
    const canAcceptTasks = user.dailyCancelCount < 2

    return res.status(200).json({
      message: 'Cancellation status fetched successfully',
      dailyCancelCount: user.dailyCancelCount,
      remainingCancellations,
      canAcceptTasks,
      limitReached: !canAcceptTasks
    })
  } catch (error) {
    console.error('Error fetching cancellation status:', error)
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while fetching cancellation status'
    })
  }
}

// GET /api/users/me/active-task - Check if user has any active tasks
const getActiveTask = async (req, res) => {
  try {
    const userId = req.userId // From auth middleware

    // Check for active tasks as a worker (acceptedBy + status in [ACCEPTED, IN_PROGRESS])
    const workerActiveTask = await Task.findOne({
      acceptedBy: userId,
      status: { $in: ['ACCEPTED', 'IN_PROGRESS'] }
    }).select('_id title status')

    // Check for active tasks as a poster (postedBy + status in [ACCEPTED, IN_PROGRESS])
    const posterActiveTask = await Task.findOne({
      postedBy: userId,
      status: { $in: ['ACCEPTED', 'IN_PROGRESS'] }
    }).select('_id title status')

    const hasActiveTask = !!(workerActiveTask || posterActiveTask)
    const activeTask = workerActiveTask || posterActiveTask
    const role = workerActiveTask ? 'worker' : (posterActiveTask ? 'poster' : null)

    return res.status(200).json({
      hasActiveTask,
      activeTaskId: activeTask ? activeTask._id.toString() : null,
      activeTaskTitle: activeTask ? activeTask.title : null,
      activeTaskStatus: activeTask ? activeTask.status : null,
      role
    })
  } catch (error) {
    console.error('Error checking active task:', error)
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while checking active task'
    })
  }
}

module.exports = {
  createUser,
  updateProfile,
  getActivity,
  getEarnings,
  getProfile,
  getCancellationStatus,
  getActiveTask
}

