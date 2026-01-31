/**
 * One-time fix for E11000 duplicate key error on users.phone (dup key: { phone: null })
 *
 * The users collection has an old unique index on "phone" that was created without
 * sparse: true. Multiple users with phone: null (e.g. Google sign-in) then violate
 * the unique constraint. This script drops that index so Mongoose can recreate it
 * with sparse: true on next app start.
 *
 * Run once: node scripts/fix-phone-index.js
 * (from server directory, with .env loaded)
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const mongoose = require('mongoose')

async function fix() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    const coll = mongoose.connection.collection('users')
    const indexes = await coll.indexes()
    const phoneIndex = indexes.find((idx) => idx.name === 'phone_1' || (idx.key && idx.key.phone === 1))
    if (phoneIndex) {
      await coll.dropIndex(phoneIndex.name)
      console.log('Dropped index:', phoneIndex.name)
    } else {
      console.log('No phone_1 index found (already fixed or different index name)')
    }
  } catch (err) {
    if (err.codeName === 'IndexNotFound') {
      console.log('Index already dropped or not present.')
    } else {
      console.error(err)
      process.exit(1)
    }
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}

fix()
