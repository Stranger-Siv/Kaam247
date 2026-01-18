const axios = require('axios')

const BASE_URL = 'http://localhost:3001'

const testFetchTasks = async () => {
  console.log('=== Testing Kaam247 Fetch Tasks API ===\n')

  try {
    // 1. Test Health Endpoint
    console.log('1. Testing Health Endpoint...')
    const healthResponse = await axios.get(`${BASE_URL}/health`)
    console.log('✅ Health check passed:', healthResponse.data.message)
    console.log('')

    // 2. Fetch Available Tasks
    console.log('2. Fetching Available Tasks...')
    const tasksResponse = await axios.get(`${BASE_URL}/api/tasks`)
    console.log('✅ Tasks fetched successfully!')
    console.log('   Total tasks:', tasksResponse.data.count)
    console.log('   Tasks:', JSON.stringify(tasksResponse.data.tasks, null, 2))
    console.log('')

    // 3. Create a new task and verify it appears in the list
    console.log('3. Creating a new task and verifying it appears...')
    
    // First, create a test user
    const userData = {
      name: 'Test User for Fetch',
      email: `test_fetch_${Date.now()}@example.com`,
      roleMode: 'poster',
      location: {
        coordinates: [77.5946, 12.9352],
        area: 'Koramangala',
        city: 'Bangalore'
      }
    }
    const userResponse = await axios.post(`${BASE_URL}/api/users`, userData)
    const userId = userResponse.data.user._id
    console.log('   Created user:', userId)

    // Create a new task
    const newTaskData = {
      title: 'Test Task for Fetch API',
      description: 'This task should appear in the fetch results',
      category: 'Cleaning',
      budget: 600,
      location: {
        coordinates: [77.5946, 12.9352],
        area: 'Koramangala',
        city: 'Bangalore'
      },
      postedBy: userId
    }
    const createResponse = await axios.post(`${BASE_URL}/api/tasks`, newTaskData)
    const newTaskId = createResponse.data.task._id
    console.log('   Created task:', newTaskId)
    console.log('   Task status:', createResponse.data.task.status)
    console.log('')

    // Fetch tasks again and verify the new task is in the list
    console.log('4. Fetching tasks again to verify new task appears...')
    const tasksResponse2 = await axios.get(`${BASE_URL}/api/tasks`)
    console.log('✅ Tasks fetched successfully!')
    console.log('   Total tasks:', tasksResponse2.data.count)
    
    const newTaskInList = tasksResponse2.data.tasks.find(t => t._id === newTaskId)
    if (newTaskInList) {
      console.log('✅ New task found in the list!')
      console.log('   Task title:', newTaskInList.title)
      console.log('   Task status:', newTaskInList.status)
    } else {
      console.log('❌ New task NOT found in the list!')
    }
    console.log('')

    // 5. Accept the task and verify it's removed from available tasks
    console.log('5. Accepting the task and verifying it\'s removed from available tasks...')
    
    // Create a worker
    const workerData = {
      name: 'Test Worker for Fetch',
      email: `test_worker_fetch_${Date.now()}@example.com`,
      roleMode: 'worker',
      location: {
        coordinates: [77.5946, 12.9352],
        area: 'Koramangala',
        city: 'Bangalore'
      }
    }
    const workerResponse = await axios.post(`${BASE_URL}/api/users`, workerData)
    const workerId = workerResponse.data.user._id
    console.log('   Created worker:', workerId)

    // Accept the task
    await axios.post(`${BASE_URL}/api/tasks/${newTaskId}/accept`, { workerId })
    console.log('   Task accepted')
    console.log('')

    // Fetch tasks again and verify the accepted task is NOT in the list
    console.log('6. Fetching tasks again to verify accepted task is removed...')
    const tasksResponse3 = await axios.get(`${BASE_URL}/api/tasks`)
    console.log('✅ Tasks fetched successfully!')
    console.log('   Total tasks:', tasksResponse3.data.count)
    
    const acceptedTaskInList = tasksResponse3.data.tasks.find(t => t._id === newTaskId)
    if (!acceptedTaskInList) {
      console.log('✅ Accepted task correctly removed from available tasks!')
    } else {
      console.log('❌ Accepted task still in the list!')
    }
    console.log('')

    console.log('✅ All tests completed successfully!')
  } catch (error) {
    console.error('\n❌ API test failed!')
    if (error.response) {
      console.error('Status:', error.response.status)
      console.error('Error:', JSON.stringify(error.response.data, null, 2))
    } else {
      console.error('Error:', error.message)
    }
  } finally {
    console.log('\n=== Test Complete ===')
  }
}

testFetchTasks()

