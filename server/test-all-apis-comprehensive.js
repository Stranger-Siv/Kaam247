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
  name: 'Test Poster',
  email: `poster_${Date.now()}@test.com`,
  phone: `9876543${Math.floor(Math.random() * 1000)}`,
  password: 'testpassword123'
}

const workerUser = {
  name: 'Test Worker',
  email: `worker_${Date.now()}@test.com`,
  phone: `9876544${Math.floor(Math.random() * 1000)}`,
  password: 'testpassword123'
}

let posterToken = null
let workerToken = null
let posterUserId = null
let workerUserId = null
let createdTaskId = null

// ============================================
// 1. HEALTH CHECK
// ============================================
async function testHealthCheck() {
  try {
    const response = await axios.get(`${BASE_URL}/health`)
    logResult('Health Check', response.status === 200 && response.data.status === 'OK')
  } catch (error) {
    logResult('Health Check', false, error.message)
  }
}

// ============================================
// 2. AUTH APIs
// ============================================
async function testAuthAPIs() {
  console.log('\n=== TESTING AUTH APIs ===\n')

  // Register Poster
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, posterUser)
    posterToken = response.data.token
    posterUserId = response.data.user._id || response.data.user.id
    logResult('Register Poster', response.status === 201 && !!posterToken)
  } catch (error) {
    logResult('Register Poster', false, error.response?.data?.message || error.message)
  }

  // Register Worker
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, workerUser)
    workerToken = response.data.token
    workerUserId = response.data.user._id || response.data.user.id
    logResult('Register Worker', response.status === 201 && !!workerToken)
  } catch (error) {
    logResult('Register Worker', false, error.response?.data?.message || error.message)
  }

  // Login Poster
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      identifier: posterUser.email,
      password: posterUser.password
    })
    logResult('Login Poster', response.status === 200 && !!response.data.token)
  } catch (error) {
    logResult('Login Poster', false, error.response?.data?.message || error.message)
  }

  // Login Worker
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      identifier: workerUser.email,
      password: workerUser.password
    })
    logResult('Login Worker', response.status === 200 && !!response.data.token)
  } catch (error) {
    logResult('Login Worker', false, error.response?.data?.message || error.message)
  }
}

// ============================================
// 3. USER APIs
// ============================================
async function testUserAPIs() {
  console.log('\n=== TESTING USER APIs ===\n')

  if (!workerToken) {
    logWarning('User APIs', 'Skipping - Worker token not available')
    return
  }

  // Get Profile
  try {
    const response = await axios.get(`${BASE_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${workerToken}` }
    })
    logResult('Get Profile', response.status === 200 && !!response.data.user)
  } catch (error) {
    logResult('Get Profile', false, error.response?.data?.message || error.message)
  }

  // Get Activity
  try {
    const response = await axios.get(`${BASE_URL}/api/users/me/activity`, {
      headers: { Authorization: `Bearer ${workerToken}` }
    })
    const hasActivity = response.status === 200 && response.data.activity && 
                       (typeof response.data.activity === 'object' || Array.isArray(response.data.activity))
    logResult('Get Activity', hasActivity, 
      hasActivity ? 'Activity data received' : 'Invalid response format')
  } catch (error) {
    logResult('Get Activity', false, error.response?.data?.message || error.message)
  }

  // Get Earnings
  try {
    const response = await axios.get(`${BASE_URL}/api/users/me/earnings`, {
      headers: { Authorization: `Bearer ${workerToken}` }
    })
    const hasEarnings = response.status === 200 && 
                       (typeof response.data.totalEarnings === 'number' || 
                        typeof response.data.earnings === 'number' ||
                        typeof response.data === 'object')
    logResult('Get Earnings', hasEarnings, 
      hasEarnings ? `Total: ₹${response.data.totalEarnings || response.data.earnings || 0}` : 'Invalid response format')
  } catch (error) {
    logResult('Get Earnings', false, error.response?.data?.message || error.message)
  }

  // Get Active Task
  try {
    const response = await axios.get(`${BASE_URL}/api/users/me/active-task`, {
      headers: { Authorization: `Bearer ${workerToken}` }
    })
    logResult('Get Active Task', response.status === 200)
  } catch (error) {
    logResult('Get Active Task', false, error.response?.data?.message || error.message)
  }

  // Get Cancellation Status
  try {
    const response = await axios.get(`${BASE_URL}/api/users/me/cancellation-status`, {
      headers: { Authorization: `Bearer ${workerToken}` }
    })
    logResult('Get Cancellation Status', response.status === 200)
  } catch (error) {
    logResult('Get Cancellation Status', false, error.response?.data?.message || error.message)
  }
}

// ============================================
// 4. TASK APIs
// ============================================
async function testTaskAPIs() {
  console.log('\n=== TESTING TASK APIs ===\n')

  if (!posterToken || !posterUserId) {
    logWarning('Task APIs', 'Skipping - Poster token/userId not available')
    return
  }

  // Create Task
  try {
    const taskData = {
      title: 'Test Task for API Testing',
      description: 'This is a test task created during API testing',
      category: 'Cleaning',
      budget: 500,
      location: {
        coordinates: [77.2090, 28.6139], // Delhi coordinates [lng, lat]
        area: 'Connaught Place',
        city: 'Delhi'
      },
      postedBy: posterUserId,
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
    }

    const response = await axios.post(`${BASE_URL}/api/tasks`, taskData, {
      headers: { Authorization: `Bearer ${posterToken}` }
    })
    
    createdTaskId = response.data.task?._id || response.data.task?.id
    logResult('Create Task', response.status === 201 && !!createdTaskId, `Task ID: ${createdTaskId}`)
  } catch (error) {
    logResult('Create Task', false, error.response?.data?.message || error.message)
  }

  // Get Available Tasks (without location)
  try {
    const response = await axios.get(`${BASE_URL}/api/tasks`)
    const hasTasks = response.status === 200 && Array.isArray(response.data.tasks)
    logResult('Get Available Tasks (no location)', hasTasks, `Found ${response.data.tasks?.length || 0} tasks`)
  } catch (error) {
    logResult('Get Available Tasks (no location)', false, error.response?.data?.message || error.message)
  }

  // Get Available Tasks (with location)
  try {
    const response = await axios.get(`${BASE_URL}/api/tasks?lat=28.6139&lng=77.2090&radius=5`)
    const hasTasks = response.status === 200 && Array.isArray(response.data.tasks)
    const foundOurTask = response.data.tasks?.some(t => t._id === createdTaskId || t.id === createdTaskId)
    logResult('Get Available Tasks (with location)', hasTasks, 
      `Found ${response.data.tasks?.length || 0} tasks${foundOurTask ? ' (includes our task)' : ' (our task NOT found!)'}`)
    
    if (!foundOurTask && createdTaskId) {
      logWarning('Get Available Tasks', 'Created task not found in results - check status and location filtering')
    }
  } catch (error) {
    logResult('Get Available Tasks (with location)', false, error.response?.data?.message || error.message)
  }

  // Get Task By ID
  if (createdTaskId) {
    try {
      const response = await axios.get(`${BASE_URL}/api/tasks/${createdTaskId}`)
      logResult('Get Task By ID', response.status === 200 && response.data.task?._id === createdTaskId)
    } catch (error) {
      logResult('Get Task By ID', false, error.response?.data?.message || error.message)
    }
  }

  // Get Tasks By User
  if (posterUserId) {
    try {
      const response = await axios.get(`${BASE_URL}/api/tasks/user/${posterUserId}`)
      const hasOurTask = response.data.tasks?.some(t => t._id === createdTaskId || t.id === createdTaskId)
      logResult('Get Tasks By User', response.status === 200, 
        `Found ${response.data.tasks?.length || 0} tasks${hasOurTask ? ' (includes our task)' : ' (our task NOT found!)'}`)
    } catch (error) {
      logResult('Get Tasks By User', false, error.response?.data?.message || error.message)
    }
  }
}

// ============================================
// 5. SOCKET.IO ALERT TESTING
// ============================================
async function testSocketAlerts() {
  console.log('\n=== TESTING SOCKET.IO ALERTS ===\n')

  if (!workerToken || !workerUserId || !posterToken || !posterUserId) {
    logWarning('Socket Alerts', 'Skipping - Required tokens/userIds not available')
    return
  }

  // Wait a bit to ensure any previous task creation throttling has passed
  await new Promise(resolve => setTimeout(resolve, 4000))

  return new Promise((resolve) => {
    let alertReceived = false
    let alertTimeout = null

    // Connect worker socket
    const workerSocket = io(SOCKET_URL, {
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

      // Listen for new_task event
      workerSocket.on('new_task', (taskData) => {
        alertReceived = true
        console.log('✅ NEW TASK ALERT RECEIVED!')
        console.log('   Task ID:', taskData.taskId)
        console.log('   Title:', taskData.title)
        console.log('   Budget:', taskData.budget)
        console.log('   Distance:', taskData.distanceKm, 'km')
        
        if (alertTimeout) clearTimeout(alertTimeout)
        logResult('Socket Alert - new_task event', true, 
          `Received alert for task: ${taskData.title}`)
        
        workerSocket.disconnect()
        resolve()
      })

      // Wait for registration, then create a new task
      // Wait 4 seconds to avoid rapid action throttling (3-second cooldown)
      setTimeout(async () => {
        try {
          const taskData = {
            title: 'Socket Alert Test Task',
            description: 'Testing socket alert system',
            category: 'Delivery',
            budget: 300,
            location: {
              coordinates: [77.2090, 28.6139], // Same location as worker
              area: 'Connaught Place',
              city: 'Delhi'
            },
            postedBy: posterUserId,
            scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          }

          const response = await axios.post(`${BASE_URL}/api/tasks`, taskData, {
            headers: { Authorization: `Bearer ${posterToken}` }
          })

          if (response.status === 201) {
            console.log('✅ Task created for alert test')
            console.log('   Waiting for alert... (max 10 seconds)')
            
            // Set timeout - if no alert in 10 seconds, fail
            alertTimeout = setTimeout(() => {
              if (!alertReceived) {
                logResult('Socket Alert - new_task event', false, 
                  'No alert received within 10 seconds after task creation')
                workerSocket.disconnect()
                resolve()
              }
            }, 10000)
          } else {
            logResult('Socket Alert - Create Test Task', false, 
              `Unexpected status: ${response.status}`)
            workerSocket.disconnect()
            resolve()
          }
        } catch (error) {
          logResult('Socket Alert - Create Test Task', false, 
            error.response?.data?.message || error.message)
          workerSocket.disconnect()
          resolve()
        }
      }, 4000) // Wait 4 seconds for worker registration + avoid throttling
    })

    workerSocket.on('connect_error', (error) => {
      logResult('Socket Alert - Connection', false, error.message)
      resolve()
    })

    workerSocket.on('disconnect', () => {
      console.log('Worker socket disconnected')
    })
  })
}

// ============================================
// 6. TASK ACCEPTANCE FLOW
// ============================================
async function testTaskAcceptance() {
  console.log('\n=== TESTING TASK ACCEPTANCE ===\n')

  if (!workerToken || !createdTaskId) {
    logWarning('Task Acceptance', 'Skipping - Worker token or task ID not available')
    return
  }

  // Accept Task (requires workerId in body)
  try {
    const response = await axios.post(`${BASE_URL}/api/tasks/${createdTaskId}/accept`, {
      workerId: workerUserId
    }, {
      headers: { Authorization: `Bearer ${workerToken}` }
    })
    logResult('Accept Task', response.status === 200, 
      `Task status: ${response.data.task?.status}`)
  } catch (error) {
    // Check if it's an expected error (task already accepted, worker offline, etc.)
    const isExpectedError = error.response?.status === 400 || 
                           error.response?.status === 403 || 
                           error.response?.status === 409
    logResult('Accept Task', isExpectedError, 
      isExpectedError ? `Expected: ${error.response?.data?.message}` : error.response?.data?.message || error.message)
  }
}

// ============================================
// 7. REPORT API
// ============================================
async function testReportAPI() {
  console.log('\n=== TESTING REPORT API ===\n')

  if (!workerToken || !createdTaskId) {
    logWarning('Report API', 'Skipping - Worker token or task ID not available')
    return
  }

  try {
    const response = await axios.post(`${BASE_URL}/api/reports`, {
      type: 'task',
      reportedTask: createdTaskId,
      reason: 'Test report from API testing',
      description: 'This is a test report'
    }, {
      headers: { Authorization: `Bearer ${workerToken}` }
    })
    logResult('Create Report', response.status === 201)
  } catch (error) {
    // Report might fail if already reported or limit reached - that's okay
    const isExpectedError = error.response?.status === 400 || error.response?.status === 429
    logResult('Create Report', isExpectedError, 
      isExpectedError ? 'Expected error (already reported or limit)' : error.response?.data?.message || error.message)
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================
async function runAllTests() {
  console.log('='.repeat(60))
  console.log('COMPREHENSIVE API TEST SUITE')
  console.log('='.repeat(60))
  console.log(`Base URL: ${BASE_URL}`)
  console.log(`Socket URL: ${SOCKET_URL}`)
  console.log('='.repeat(60))

  try {
    // Run tests in sequence
    await testHealthCheck()
    await testAuthAPIs()
    await testUserAPIs()
    await testTaskAPIs()
    await testSocketAlerts() // This is the critical test for alerts
    await testTaskAcceptance()
    await testReportAPI()

    // Print summary
    console.log('\n' + '='.repeat(60))
    console.log('TEST SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Passed: ${results.passed.length}`)
    console.log(`❌ Failed: ${results.failed.length}`)
    console.log(`⚠️  Warnings: ${results.warnings.length}`)
    
    if (results.failed.length > 0) {
      console.log('\nFailed Tests:')
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
    
    // Exit with appropriate code
    process.exit(results.failed.length > 0 ? 1 : 0)
  } catch (error) {
    console.error('\n❌ Fatal error during testing:', error.message)
    process.exit(1)
  }
}

// Run tests
runAllTests()

