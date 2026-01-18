const Report = require('../models/Report')
const Task = require('../models/Task')
const User = require('../models/User')
const mongoose = require('mongoose')
const { authenticate } = require('../middleware/auth')

// POST /api/reports - Create a new report
const createReport = async (req, res) => {
  try {
    const { reportedUser, reportedTask, reason, description } = req.body
    const reporterId = req.userId // From auth middleware

    // Validate required fields
    if (!reason) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Reason is required'
      })
    }

    // Validate reason options
    const validReasons = [
      'Fake or misleading task',
      'User not responding',
      'Inappropriate content',
      'Safety concern',
      'Other'
    ]
    if (!validReasons.includes(reason)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid reason'
      })
    }

    // Validate reportedTask if provided
    if (reportedTask) {
      if (!mongoose.Types.ObjectId.isValid(reportedTask)) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Invalid task ID'
        })
      }
      const task = await Task.findById(reportedTask)
      if (!task) {
        return res.status(404).json({
          error: 'Task not found',
          message: 'Reported task does not exist'
        })
      }
    }

    // Validate reportedUser if provided
    if (reportedUser) {
      if (!mongoose.Types.ObjectId.isValid(reportedUser)) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Invalid user ID'
        })
      }
      const user = await User.findById(reportedUser)
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'Reported user does not exist'
        })
      }
    }

    // ABUSE PREVENTION: Get reporter user to check limits
    const reporter = await User.findById(reporterId)
    if (!reporter) {
      return res.status(404).json({
        error: 'Reporter not found',
        message: 'Reporter user does not exist'
      })
    }

    // ABUSE PREVENTION: Check daily report limit (max 3 per day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const lastReportDate = reporter.lastReportDate ? new Date(reporter.lastReportDate) : null
    let lastReportDay = null
    if (lastReportDate) {
      lastReportDay = new Date(lastReportDate)
      lastReportDay.setHours(0, 0, 0, 0)
    }

    // Reset counter if new day
    if (!lastReportDay || lastReportDay.getTime() !== today.getTime()) {
      if (reporter.dailyReportCount > 0) {
        reporter.dailyReportCount = 0
        reporter.lastReportDate = today
        await reporter.save()
      }
    }

    // Check if daily limit reached
    if (reporter.dailyReportCount >= 3) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Report limit reached. Please try later.'
      })
    }

    // ABUSE PREVENTION: Check for duplicate report (same reporter, same task/user)
    const duplicateQuery = {
      reporter: reporterId
    }
    
    if (reportedTask) {
      duplicateQuery.reportedTask = reportedTask
      // Check if already reported this task
      const existingTaskReport = await Report.findOne(duplicateQuery)
      if (existingTaskReport) {
        return res.status(409).json({
          error: 'Duplicate report',
          message: 'You have already reported this task.'
        })
      }
    }
    
    if (reportedUser) {
      // Check if already reported this user today
      const todayStart = new Date(today)
      const existingUserReport = await Report.findOne({
        reporter: reporterId,
        reportedUser: reportedUser,
        createdAt: { $gte: todayStart }
      })
      if (existingUserReport) {
        return res.status(409).json({
          error: 'Duplicate report',
          message: 'You have already reported this user today.'
        })
      }
    }

    // RAPID ACTION THROTTLING: Check if same action within 3 seconds
    const lastReportTimestamp = reporter.lastActionTimestamps?.get('createReport')
    if (lastReportTimestamp) {
      const timeSinceLastReport = Date.now() - new Date(lastReportTimestamp).getTime()
      if (timeSinceLastReport < 3000) {
        return res.status(429).json({
          error: 'Too many requests',
          message: 'Please wait a moment before submitting another report.'
        })
      }
    }

    // Create report
    const report = new Report({
      reporter: reporterId,
      reportedUser: reportedUser || null,
      reportedTask: reportedTask || null,
      reason,
      description: description || '',
      status: 'open'
    })

    await report.save()

    // Update reporter's report count and timestamp
    if (!reporter.lastActionTimestamps) {
      reporter.lastActionTimestamps = new Map()
    }
    reporter.lastActionTimestamps.set('createReport', new Date())
    reporter.dailyReportCount += 1
    reporter.lastReportDate = today
    await reporter.save()

    // Populate reporter for response
    await report.populate('reporter', 'name email')
    if (report.reportedUser) {
      await report.populate('reportedUser', 'name email')
    }
    if (report.reportedTask) {
      await report.populate('reportedTask', 'title status')
    }

    res.status(201).json({
      message: 'Report submitted successfully',
      report: report.toObject()
    })
  } catch (error) {
    console.error('Error creating report:', error)
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to create report'
    })
  }
}

module.exports = {
  createReport
}

