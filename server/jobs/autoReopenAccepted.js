/**
 * Auto-reopen tasks that are ACCEPTED but worker never started within X minutes.
 * Runs on a schedule (e.g. every 15 min). College pilot accountability.
 */
const Task = require('../models/Task')
const User = require('../models/User')
const { notifyTaskCancelled, notifyTaskStatusChanged, notifyTaskRemoved } = require('../socket/socketHandler')
const { invalidateStatsAndAdminDashboards } = require('../utils/cache')

const ACCEPT_TO_START_MINUTES = 30 // Auto-reopen if worker doesn't start within 30 minutes
const PREFIX = '[autoReopenAccepted]'

function logError(msg, err) {
  console.error(PREFIX, msg, err && (err.message || err))
}

async function runAutoReopenAccepted() {
  try {
    const cutoff = new Date(Date.now() - ACCEPT_TO_START_MINUTES * 60 * 1000)
    const tasks = await Task.find({
      status: 'ACCEPTED',
      acceptedAt: { $lt: cutoff },
      $or: [{ startedAt: null }, { startedAt: { $exists: false } }]
    })
      .select('_id postedBy acceptedBy')
      .lean()

    if (tasks.length === 0) return

    for (const task of tasks) {
      try {
        await Task.findByIdAndUpdate(task._id, {
          $set: { status: 'SEARCHING', acceptedBy: null, acceptedAt: null }
        })
        const taskIdStr = task._id.toString()
        const posterId = task.postedBy?.toString()
        const workerId = task.acceptedBy?.toString()
        // Increment worker's noShowCount since they accepted but never started
        if (workerId) {
          await User.findByIdAndUpdate(workerId, { $inc: { noShowCount: 1 } }).catch(() => {})
          notifyTaskCancelled(workerId, taskIdStr, 'auto_reopen')
          notifyTaskStatusChanged(workerId, taskIdStr, 'SEARCHING')
        }
        if (posterId) notifyTaskStatusChanged(posterId, taskIdStr, 'SEARCHING')
        notifyTaskRemoved(null, taskIdStr)
      } catch (err) {
        logError(`Task ${task._id}`, err)
      }
    }
    invalidateStatsAndAdminDashboards()
  } catch (err) {
    logError('run', err)
  }
}

module.exports = { runAutoReopenAccepted, ACCEPT_TO_START_MINUTES }
