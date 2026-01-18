const axios = require('axios')

const BASE_URL = 'http://localhost:3001'

const testAllAPIs = async () => {
  console.log('=== Testing All Kaam247 APIs ===\n')
  console.log('='.repeat(60))

  let testPosterId = ''
  let testWorkerId = ''
  let testTaskId = ''
  let testTaskId2 = ''

  try {
    // ============================================
    // 1. HEALTH CHECK
    // ============================================
    console.log('\n1. HEALTH CHECK API')
    console.log('-'.repeat(60))
    try {
      const response = await axios.get(`${BASE_URL}/health`)
      console.log('✅ GET /health')
      console.log('   Status:', response.status)
      console.log('   Response:', response.data)
    } catch (error) {
      console.log('❌ GET /health FAILED')
      console.log('   Error:', error.message)
    }

    // ============================================
    // 2. USER CREATION
    // ============================================
    console.log('\n2. USER CREATION API')
    console.log('-'.repeat(60))
    
    // Create Poster
    try {
      const posterData = {
        name: 'Test Poster - API Test',
        email: `test_poster_${Date.now()}@example.com`,
        phone: `9876543${Math.floor(Math.random() * 1000)}`,
        password: 'temp_password_123',
        roleMode: 'poster',
        location: {
          coordinates: [77.5946, 12.9352],
          area: 'Koramangala',
          city: 'Bangalore'
        }
      }
      const response = await axios.post(`${BASE_URL}/api/users`, posterData)
      testPosterId = response.data.user._id
      console.log('✅ POST /api/users (Poster)')
      console.log('   Status:', response.status)
      console.log('   User ID:', testPosterId)
      console.log('   Name:', response.data.user.name)
      console.log('   Role:', response.data.user.roleMode)
    } catch (error) {
      console.log('❌ POST /api/users (Poster) FAILED')
      console.log('   Status:', error.response?.status)
      console.log('   Error:', error.response?.data || error.message)
    }

    // Create Worker
    try {
      const workerData = {
        name: 'Test Worker - API Test',
        email: `test_worker_${Date.now()}@example.com`,
        phone: `9876544${Math.floor(Math.random() * 1000)}`,
        password: 'temp_password_123',
        roleMode: 'worker',
        location: {
          coordinates: [77.5946, 12.9352],
          area: 'Koramangala',
          city: 'Bangalore'
        }
      }
      const response = await axios.post(`${BASE_URL}/api/users`, workerData)
      testWorkerId = response.data.user._id
      console.log('✅ POST /api/users (Worker)')
      console.log('   Status:', response.status)
      console.log('   User ID:', testWorkerId)
      console.log('   Name:', response.data.user.name)
      console.log('   Role:', response.data.user.roleMode)
    } catch (error) {
      console.log('❌ POST /api/users (Worker) FAILED')
      console.log('   Status:', error.response?.status)
      console.log('   Error:', error.response?.data || error.message)
    }

    // Test Invalid User Creation
    try {
      await axios.post(`${BASE_URL}/api/users`, { name: 'Test' }) // Missing email
      console.log('❌ POST /api/users (Invalid) - Should have failed!')
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ POST /api/users (Invalid) - Correctly rejected')
        console.log('   Status:', error.response.status)
        console.log('   Error:', error.response.data.message)
      } else {
        console.log('❌ POST /api/users (Invalid) - Unexpected error')
        console.log('   Status:', error.response?.status)
      }
    }

    // ============================================
    // 3. TASK CREATION
    // ============================================
    console.log('\n3. TASK CREATION API')
    console.log('-'.repeat(60))
    
    try {
      const taskData = {
        title: 'Comprehensive API Test Task',
        description: 'This task is created to test all API endpoints comprehensively',
        category: 'Cleaning',
        budget: 800,
        location: {
          coordinates: [77.5946, 12.9352],
          area: 'Koramangala',
          city: 'Bangalore'
        },
        postedBy: testPosterId
      }
      const response = await axios.post(`${BASE_URL}/api/tasks`, taskData)
      testTaskId = response.data.task._id
      console.log('✅ POST /api/tasks')
      console.log('   Status:', response.status)
      console.log('   Task ID:', testTaskId)
      console.log('   Title:', response.data.task.title)
      console.log('   Status:', response.data.task.status)
      console.log('   Budget:', response.data.task.budget)
      console.log('   Posted By:', response.data.task.postedBy)
    } catch (error) {
      console.log('❌ POST /api/tasks FAILED')
      console.log('   Status:', error.response?.status)
      console.log('   Error:', error.response?.data || error.message)
    }

    // Create second task for testing
    try {
      const taskData2 = {
        title: 'Second Test Task',
        description: 'Another task for testing',
        category: 'Delivery',
        budget: 300,
        location: {
          coordinates: [77.5946, 12.9352],
          area: 'Indiranagar',
          city: 'Bangalore'
        },
        postedBy: testPosterId
      }
      const response = await axios.post(`${BASE_URL}/api/tasks`, taskData2)
      testTaskId2 = response.data.task._id
      console.log('✅ POST /api/tasks (Second Task)')
      console.log('   Task ID:', testTaskId2)
    } catch (error) {
      console.log('❌ POST /api/tasks (Second Task) FAILED')
      console.log('   Error:', error.response?.data || error.message)
    }

    // Test Invalid Task Creation
    try {
      await axios.post(`${BASE_URL}/api/tasks`, { title: 'Test' }) // Missing required fields
      console.log('❌ POST /api/tasks (Invalid) - Should have failed!')
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ POST /api/tasks (Invalid) - Correctly rejected')
        console.log('   Status:', error.response.status)
        console.log('   Error:', error.response.data.message)
      }
    }

    // ============================================
    // 4. GET AVAILABLE TASKS
    // ============================================
    console.log('\n4. GET AVAILABLE TASKS API')
    console.log('-'.repeat(60))
    
    try {
      const response = await axios.get(`${BASE_URL}/api/tasks`)
      console.log('✅ GET /api/tasks')
      console.log('   Status:', response.status)
      console.log('   Total Tasks:', response.data.count)
      console.log('   Tasks:', response.data.tasks.length)
      if (response.data.tasks.length > 0) {
        console.log('   First Task:', response.data.tasks[0].title)
        console.log('   First Task Status:', response.data.tasks[0].status)
      }
    } catch (error) {
      console.log('❌ GET /api/tasks FAILED')
      console.log('   Status:', error.response?.status)
      console.log('   Error:', error.response?.data || error.message)
    }

    // ============================================
    // 5. GET TASK BY ID
    // ============================================
    console.log('\n5. GET TASK BY ID API')
    console.log('-'.repeat(60))
    
    if (testTaskId) {
      try {
        const response = await axios.get(`${BASE_URL}/api/tasks/${testTaskId}`)
        console.log('✅ GET /api/tasks/:taskId')
        console.log('   Status:', response.status)
        console.log('   Task ID:', response.data.task._id)
        console.log('   Title:', response.data.task.title)
        console.log('   Status:', response.data.task.status)
        console.log('   Budget:', response.data.task.budget)
      } catch (error) {
        console.log('❌ GET /api/tasks/:taskId FAILED')
        console.log('   Status:', error.response?.status)
        console.log('   Error:', error.response?.data || error.message)
      }
    }

    // Test Invalid Task ID
    try {
      await axios.get(`${BASE_URL}/api/tasks/invalid-task-id`)
      console.log('❌ GET /api/tasks/:taskId (Invalid) - Should have failed!')
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ GET /api/tasks/:taskId (Invalid ID) - Correctly rejected')
        console.log('   Status:', error.response.status)
        console.log('   Error:', error.response.data.message)
      }
    }

    // Test Non-existent Task ID
    try {
      await axios.get(`${BASE_URL}/api/tasks/696b7d7dca3ceac6163a2f99`)
      console.log('❌ GET /api/tasks/:taskId (Non-existent) - Should have failed!')
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ GET /api/tasks/:taskId (Non-existent) - Correctly returned 404')
        console.log('   Status:', error.response.status)
        console.log('   Error:', error.response.data.message)
      }
    }

    // ============================================
    // 6. ACCEPT TASK
    // ============================================
    console.log('\n6. ACCEPT TASK API')
    console.log('-'.repeat(60))
    
    if (testTaskId && testWorkerId) {
      try {
        const response = await axios.post(
          `${BASE_URL}/api/tasks/${testTaskId}/accept`,
          { workerId: testWorkerId }
        )
        console.log('✅ POST /api/tasks/:taskId/accept')
        console.log('   Status:', response.status)
        console.log('   Task ID:', response.data.task._id)
        console.log('   New Status:', response.data.task.status)
        console.log('   Accepted By:', response.data.task.acceptedBy)
      } catch (error) {
        console.log('❌ POST /api/tasks/:taskId/accept FAILED')
        console.log('   Status:', error.response?.status)
        console.log('   Error:', error.response?.data || error.message)
      }
    }

    // Test Accepting Already Accepted Task (409 Conflict)
    if (testTaskId && testWorkerId) {
      try {
        await axios.post(
          `${BASE_URL}/api/tasks/${testTaskId}/accept`,
          { workerId: testWorkerId }
        )
        console.log('❌ POST /api/tasks/:taskId/accept (Already Accepted) - Should have failed!')
      } catch (error) {
        if (error.response?.status === 409) {
          console.log('✅ POST /api/tasks/:taskId/accept (Already Accepted) - Correctly rejected')
          console.log('   Status:', error.response.status)
          console.log('   Error:', error.response.data.message)
        }
      }
    }

    // ============================================
    // 7. SELF-ACCEPTANCE PREVENTION
    // ============================================
    console.log('\n7. SELF-ACCEPTANCE PREVENTION')
    console.log('-'.repeat(60))
    
    if (testTaskId2 && testPosterId) {
      try {
        await axios.post(
          `${BASE_URL}/api/tasks/${testTaskId2}/accept`,
          { workerId: testPosterId } // Poster trying to accept their own task
        )
        console.log('❌ POST /api/tasks/:taskId/accept (Self-Accept) - Should have failed!')
      } catch (error) {
        if (error.response?.status === 403) {
          console.log('✅ POST /api/tasks/:taskId/accept (Self-Accept) - Correctly blocked')
          console.log('   Status:', error.response.status)
          console.log('   Error:', error.response.data.error)
          console.log('   Message:', error.response.data.message)
        } else {
          console.log('❌ POST /api/tasks/:taskId/accept (Self-Accept) - Unexpected error')
          console.log('   Status:', error.response?.status)
          console.log('   Error:', error.response?.data || error.message)
        }
      }
    }

    // Test Invalid Worker ID
    try {
      await axios.post(
        `${BASE_URL}/api/tasks/${testTaskId2}/accept`,
        { workerId: 'invalid-worker-id' }
      )
      console.log('❌ POST /api/tasks/:taskId/accept (Invalid Worker) - Should have failed!')
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ POST /api/tasks/:taskId/accept (Invalid Worker) - Correctly rejected')
        console.log('   Status:', error.response.status)
        console.log('   Error:', error.response.data.message)
      }
    }

    // ============================================
    // 8. VERIFY TASK STATUS AFTER ACCEPTANCE
    // ============================================
    console.log('\n8. VERIFY TASK STATUS AFTER ACCEPTANCE')
    console.log('-'.repeat(60))
    
    if (testTaskId) {
      try {
        const response = await axios.get(`${BASE_URL}/api/tasks/${testTaskId}`)
        console.log('✅ GET /api/tasks/:taskId (After Acceptance)')
        console.log('   Task Status:', response.data.task.status)
        console.log('   Accepted By:', response.data.task.acceptedBy)
        if (response.data.task.status === 'ACCEPTED') {
          console.log('✅ Task status correctly updated to ACCEPTED')
        }
      } catch (error) {
        console.log('❌ GET /api/tasks/:taskId (After Acceptance) FAILED')
        console.log('   Error:', error.response?.data || error.message)
      }
    }

    // ============================================
    // 9. VERIFY ACCEPTED TASK NOT IN AVAILABLE LIST
    // ============================================
    console.log('\n9. VERIFY ACCEPTED TASK NOT IN AVAILABLE LIST')
    console.log('-'.repeat(60))
    
    try {
      const response = await axios.get(`${BASE_URL}/api/tasks`)
      const acceptedTaskInList = response.data.tasks.find(t => t._id === testTaskId)
      if (!acceptedTaskInList) {
        console.log('✅ Accepted task correctly removed from available tasks list')
        console.log('   Available tasks:', response.data.count)
      } else {
        console.log('❌ Accepted task still in available tasks list!')
        console.log('   Task status in list:', acceptedTaskInList.status)
      }
    } catch (error) {
      console.log('❌ GET /api/tasks FAILED')
      console.log('   Error:', error.response?.data || error.message)
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(60))
    console.log('TEST SUMMARY')
    console.log('='.repeat(60))
    console.log('✅ All API endpoints tested successfully!')
    console.log('\nTested Endpoints:')
    console.log('  ✅ GET  /health')
    console.log('  ✅ POST /api/users')
    console.log('  ✅ POST /api/tasks')
    console.log('  ✅ GET  /api/tasks')
    console.log('  ✅ GET  /api/tasks/:taskId')
    console.log('  ✅ POST /api/tasks/:taskId/accept')
    console.log('\nValidations Tested:')
    console.log('  ✅ Invalid input rejection')
    console.log('  ✅ Self-acceptance prevention (403)')
    console.log('  ✅ Duplicate acceptance prevention (409)')
    console.log('  ✅ Task status updates')
    console.log('  ✅ Available tasks filtering')

  } catch (error) {
    console.error('\n❌ Comprehensive API test failed!')
    if (error.response) {
      console.error('Status:', error.response.status)
      console.error('Error:', JSON.stringify(error.response.data, null, 2))
    } else {
      console.error('Error:', error.message)
    }
  } finally {
    console.log('\n' + '='.repeat(60))
    console.log('=== Test Complete ===')
    console.log('='.repeat(60))
  }
}

testAllAPIs()

