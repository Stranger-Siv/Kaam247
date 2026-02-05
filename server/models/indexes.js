/**
 * Ensure all indexes defined in Mongoose schemas exist in MongoDB.
 * Index definitions live in the model files (Task, User, Report, AdminLog); this script
 * applies them. Safe to run on every deploy; createIndexes is idempotent.
 *
 * Usage: node server/models/indexes.js   (after MONGO_URI is set)
 * Or from app: require('./models/indexes').ensureIndexes()
 */

const Task = require('./Task')
const User = require('./User')
const Report = require('./Report')
const AdminLog = require('./AdminLog')

/**
 * Create indexes for all models that define them. Requires an active MongoDB connection.
 * @returns {Promise<void>}
 */
async function ensureIndexes() {
  await Task.createIndexes()
  await User.createIndexes()
  await Report.createIndexes()
  await AdminLog.createIndexes()
}

module.exports = {
  ensureIndexes
}

if (require.main === module) {
  const connectDB = require('../config/db')
  connectDB()
    .then(() => ensureIndexes())
    .then(() => {
      console.log('Indexes ensured.')
      process.exit(0)
    })
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
