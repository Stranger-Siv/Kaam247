const axios = require('axios')
const { io } = require('socket.io-client')

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001'
const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:3001'

// Test results tracking
const results = {
  passed: [],
  failed: [],
  warnings: []
}

// Helper function to log results
function logResult(testName, passed, message = '') {
  if (passed) {
    results.passed.push(testName)
    console.log(`✅ ${testName}${message ? ': ' + message : ''}`)
  } else {
    results.failed.push({ test: testName, error: message })
    console.log(`❌ ${testName}${message ? ': ' + message : ''}`)
  }
}

function logWarning(testName, message) {
  results.warnings.push({ test: testName, warning: message })
  console.log(`⚠️  ${testName}: ${message}`)
}

// Test users data
const posterUser = {
  name: 'Lifecycle Test Poster',
  email: `poster_lifecycle_${Date.now()}@test.com`,
  phone: `9876543${Math.floor(Math.random() * 1000)}`,
  password: 'testpassword123'
}

const workerUser = {
  name: 'Lifecycle Test Worker',
  email: `worker_lifecycle_${Date.now()}@test.com`,
  phone: `9876544${Math.floor(Math.random() * 1000)}`,
  password: 'testpassword123'
}

let posterToken = null
let workerToken = null
let posterUserId = null
let workerUserId = null
let createdTaskId = null
let workerSocket = null

// ============================================
// SETUP: Register and Login Users
// ============================================
async function setupUsers() {
  console.log('\n=== SETTING UP TEST USERS ===\n')

  // Register Poster
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, posterUser)
    posterToken = response.data.token
    posterUserId = response.data.user._id || response.data.user.id
    logResult('Register Poster', response.status === 201 && !!posterToken)
  } catch (error) {
    logResult('Register Poster', false, error.response?.data?.message || error.message)
    throw error
  }

  // Register Worker
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, workerUser)
    workerToken = response.data.token
    workerUserId = response.data.user._id || response.data.user.id
    logResult('Register Worker', response.status === 201 && !!workerToken)
  } catch (error) {
    logResult('Register Worker', false, error.response?.data?.message || error.message)
    throw error
  }
}

// ============================================
// STEP 1: CREATE TASK
// ============================================
async function step1_CreateTask() {
  console.log('\n=== STEP 1: CREATE TASK ===\n')

  if (!posterToken || !posterUserId) {
    logWarning('Create Task', 'Skipping - Poster token/userId not available')
    return false
  }

  try {
    const taskData = {
      title: 'Lifecycle Test Task',
      description: 'Testing complete task lifecycle flow',
      category: 'Cleaning',
      budget: 500,
      location: {
        coordinates: [77.2090, 28.6139], // Delhi coordinates [lng, lat]
        area: 'Connaught Place',
        city: 'Delhi'
      },
      postedBy: posterUserId,
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }

    const response = await axios.post(`${BASE_URL}/api/tasks`, taskData, {
      headers: { Authorization: `Bearer ${posterToken}` }
    })
    
    createdTaskId = response.data.task?._id || response.data.task?.id
    const taskStatus = response.data.task?.status
    
    logResult('Create Task', response.status === 201 && !!createdTaskId, 
      `Task ID: ${createdTaskId}, Status: ${taskStatus}`)
    
    return createdTaskId !== null
  } catch (error) {
    logResult('Create Task', false, error.response?.data?.message || error.message)
    return false
  }
}

// ============================================
// STEP 2: SETUP WORKER SOCKET (ONLINE)
// ============================================
async function step2_SetupWorkerSocket() {
  console.log('\n=== STEP 2: SETUP WORKER SOCKET (ONLINE) ===\n')

  if (!workerToken || !workerUserId) {
    logWarning('Setup Worker Socket', 'Skipping - Worker token/userId not available')
    return false
  }

  return new Promise((resolve) => {
    workerSocket = io(SOCKET_URL, {
      auth: {
        token: workerToken
      },
      transports: ['websocket', 'polling']
    })

    workerSocket.on('connect', async () => {
      console.log('✅ Worker socket connected')

      // Register worker as online with location
      workerSocket.emit('clientConnected', {
        userId: workerUserId,
        role: 'worker',
        mode: 'worker',
        isOnline: true,
        location: {
          lat: 28.6139, // Delhi - close to task location
          lng: 77.2090
        }
      })

      // Register worker online
      workerSocket.emit('worker_online', {
        userId: workerUserId,
        location: {
          lat: 28.6139,
          lng: 77.2090
        },
        radius: 5
      })

      console.log('✅ Worker registered as online')
      logResult('Setup Worker Socket', true, 'Worker is now ONLINE')
      
      // Wait a bit for registration to complete
      setTimeout(() => resolve(true), 2000)
    })

    workerSocket.on('connect_error', (error) => {
      logResult('Setup Worker Socket', false, error.message)
      resolve(false)
    })

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!workerSocket.connected) {
        logResult('Setup Worker Socket', false, 'Connection timeout')
        resolve(false)
      }
    }, 10000)
  })
}

// ============================================
// STEP 3: ACCEPT TASK
// ============================================
async function step3_AcceptTask() {
  console.log('\n=== STEP 3: ACCEPT TASK ===\n')

  if (!workerToken || !workerUserId || !createdTaskId) {
    logWarning('Accept Task', 'Skipping - Required data not available')
    return false
  }

  try {
    const response = await axios.post(`${BASE_URL}/api/tasks/${createdTaskId}/accept`, {
      workerId: workerUserId
    }, {
      headers: { Authorization: `Bearer ${workerToken}` }
    })
    
    const taskStatus = response.data.task?.status
    const acceptedBy = response.data.task?.acceptedBy
    
    logResult('Accept Task', response.status === 200 && taskStatus === 'ACCEPTED', 
      `Status: ${taskStatus}, Accepted by: ${acceptedBy}`)
    
    return response.status === 200 && taskStatus === 'ACCEPTED'
  } catch (error) {
    logResult('Accept Task', false, error.response?.data?.message || error.message)
    return false
  }
}

// ============================================
// STEP 4: START TASK
// ============================================
async function step4_StartTask() {
  console.log('\n=== STEP 4: START TASK ===\n')

  if (!workerToken || !workerUserId || !createdTaskId) {
    logWarning('Start Task', 'Skipping - Required data not available')
    return false
  }

  try {
    const response = await axios.post(`${BASE_URL}/api/tasks/${createdTaskId}/start`, {
      workerId: workerUserId
    }, {
      headers: { Authorization: `Bearer ${workerToken}` }
    })
    
    const taskStatus = response.data.task?.status
    const startedAt = response.data.task?.startedAt
    
    logResult('Start Task', response.status === 200 && taskStatus === 'IN_PROGRESS', 
      `Status: ${taskStatus}, Started at: ${startedAt}`)
    
    return response.status === 200 && taskStatus === 'IN_PROGRESS'
  } catch (error) {
    logResult('Start Task', false, error.response?.data?.message || error.message)
    return false
  }
}

// ============================================
// STEP 5: MARK COMPLETE (Worker)
// ============================================
async function step5_MarkComplete() {
  console.log('\n=== STEP 5: MARK COMPLETE (Worker) ===\n')

  if (!workerToken || !workerUserId || !createdTaskId) {
    logWarning('Mark Complete', 'Skipping - Required data not available')
    return false
  }

  try {
    const response = await axios.post(`${BASE_URL}/api/tasks/${createdTaskId}/mark-complete`, {
      workerId: workerUserId
    }, {
      headers: { Authorization: `Bearer ${workerToken}` }
    })
    
    const workerCompleted = response.data.task?.workerCompleted
    const taskStatus = response.data.task?.status
    
    logResult('Mark Complete', response.status === 200 && workerCompleted === true, 
      `Status: ${taskStatus}, Worker Completed: ${workerCompleted}`)
    
    return response.status === 200 && workerCompleted === true
  } catch (error) {
    logResult('Mark Complete', false, error.response?.data?.message || error.message)
    return false
  }
}

// ============================================
// STEP 6: CONFIRM COMPLETE (Poster)
// ============================================
async function step6_ConfirmComplete() {
  console.log('\n=== STEP 6: CONFIRM COMPLETE (Poster) ===\n')

  if (!posterToken || !posterUserId || !createdTaskId) {
    logWarning('Confirm Complete', 'Skipping - Required data not available')
    return false
  }

  try {
    const response = await axios.post(`${BASE_URL}/api/tasks/${createdTaskId}/confirm-complete`, {
      posterId: posterUserId
    }, {
      headers: { Authorization: `Bearer ${posterToken}` }
    })
    
    const taskStatus = response.data.task?.status
    const completedAt = response.data.task?.completedAt
    
    logResult('Confirm Complete', response.status === 200 && taskStatus === 'COMPLETED', 
      `Status: ${taskStatus}, Completed at: ${completedAt}`)
    
    return response.status === 200 && taskStatus === 'COMPLETED'
  } catch (error) {
    logResult('Confirm Complete', false, error.response?.data?.message || error.message)
    return false
  }
}

// ============================================
// STEP 7: RATE TASK (Poster)
// ============================================
async function step7_RateTask() {
  console.log('\n=== STEP 7: RATE TASK (Poster) ===\n')

  if (!posterToken || !posterUserId || !createdTaskId) {
    logWarning('Rate Task', 'Skipping - Required data not available')
    return false
  }

  try {
    const response = await axios.post(`${BASE_URL}/api/tasks/${createdTaskId}/rate`, {
      posterId: posterUserId,
      rating: 5,
      review: 'Excellent work! Lifecycle test completed successfully.'
    }, {
      headers: { Authorization: `Bearer ${posterToken}` }
    })
    
    const rating = response.data.task?.rating
    const review = response.data.task?.review
    
    logResult('Rate Task', response.status === 200 && rating === 5, 
      `Rating: ${rating}, Review: ${review?.substring(0, 30)}...`)
    
    return response.status === 200 && rating === 5
  } catch (error) {
    logResult('Rate Task', false, error.response?.data?.message || error.message)
    return false
  }
}

// ============================================
// CLEANUP
// ============================================
async function cleanup() {
  console.log('\n=== CLEANUP ===\n')
  
  if (workerSocket) {
    workerSocket.disconnect()
    console.log('✅ Worker socket disconnected')
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================
async function runLifecycleTest() {
  console.log('='.repeat(60))
  console.log('TASK LIFECYCLE FLOW TEST')
  console.log('='.repeat(60))
  console.log(`Base URL: ${BASE_URL}`)
  console.log(`Socket URL: ${SOCKET_URL}`)
  console.log('='.repeat(60))

  try {
    // Setup
    await setupUsers()
    await new Promise(resolve => setTimeout(resolve, 2000)) // Wait for user creation

    // Run lifecycle steps
    const step1 = await step1_CreateTask()
    if (!step1) {
      console.log('\n❌ Cannot continue - Task creation failed')
      await cleanup()
      process.exit(1)
    }

    await new Promise(resolve => setTimeout(resolve, 4000)) // Wait to avoid throttling

    const step2 = await step2_SetupWorkerSocket()
    if (!step2) {
      console.log('\n⚠️  Worker socket setup failed, but continuing...')
    }

    await new Promise(resolve => setTimeout(resolve, 2000)) // Wait for socket registration

    const step3 = await step3_AcceptTask()
    if (!step3) {
      console.log('\n❌ Cannot continue - Task acceptance failed')
      await cleanup()
      process.exit(1)
    }

    await new Promise(resolve => setTimeout(resolve, 2000))

    const step4 = await step4_StartTask()
    if (!step4) {
      console.log('\n❌ Cannot continue - Task start failed')
      await cleanup()
      process.exit(1)
    }

    await new Promise(resolve => setTimeout(resolve, 2000))

    const step5 = await step5_MarkComplete()
    if (!step5) {
      console.log('\n❌ Cannot continue - Mark complete failed')
      await cleanup()
      process.exit(1)
    }

    await new Promise(resolve => setTimeout(resolve, 2000))

    const step6 = await step6_ConfirmComplete()
    if (!step6) {
      console.log('\n❌ Cannot continue - Confirm complete failed')
      await cleanup()
      process.exit(1)
    }

    await new Promise(resolve => setTimeout(resolve, 2000))

    const step7 = await step7_RateTask()
    if (!step7) {
      console.log('\n⚠️  Rating failed, but lifecycle is complete')
    }

    // Cleanup
    await cleanup()

    // Print summary
    console.log('\n' + '='.repeat(60))
    console.log('LIFECYCLE TEST SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Passed: ${results.passed.length}`)
    console.log(`❌ Failed: ${results.failed.length}`)
    console.log(`⚠️  Warnings: ${results.warnings.length}`)
    
    if (results.failed.length > 0) {
      console.log('\nFailed Steps:')
      results.failed.forEach(f => {
        console.log(`  ❌ ${f.test}: ${f.error}`)
      })
    }

    if (results.warnings.length > 0) {
      console.log('\nWarnings:')
      results.warnings.forEach(w => {
        console.log(`  ⚠️  ${w.test}: ${w.warning}`)
      })
    }

    console.log('\n' + '='.repeat(60))
    
    if (step1 && step3 && step4 && step5 && step6) {
      console.log('🎉 COMPLETE TASK LIFECYCLE TEST PASSED!')
      console.log('   Flow: CREATE → ACCEPT → START → MARK COMPLETE → CONFIRM → RATE')
    } else {
      console.log('❌ Task lifecycle test incomplete')
    }
    
    console.log('='.repeat(60))
    
    // Exit with appropriate code
    process.exit(results.failed.length > 0 ? 1 : 0)
  } catch (error) {
    console.error('\n❌ Fatal error during lifecycle testing:', error.message)
    console.error(error.stack)
    await cleanup()
    process.exit(1)
  }
}

// Run lifecycle test
runLifecycleTest()

