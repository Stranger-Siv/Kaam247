const axios = require('axios')

const BASE_URL = 'http://localhost:3001'

const testGetTaskById = async () => {
  console.log('=== Testing Kaam247 Get Task by ID API ===\n')

  let testTaskId = ''

  try {
    // 1. Test Health Endpoint
    console.log('1. Testing Health Endpoint...')
    const healthResponse = await axios.get(`${BASE_URL}/health`)
    console.log('✅ Health check passed:', healthResponse.data.message)
    console.log('')

    // 2. Create a test task first
    console.log('2. Creating a test task...')
    const userData = {
      name: 'Test User for Get Task',
      email: `test_get_task_${Date.now()}@example.com`,
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

    const taskData = {
      title: 'Test Task for Get by ID',
      description: 'This is a test task to verify get by ID API',
      category: 'Cleaning',
      budget: 700,
      location: {
        coordinates: [77.5946, 12.9352],
        area: 'Koramangala',
        city: 'Bangalore'
      },
      postedBy: userId
    }
    const createResponse = await axios.post(`${BASE_URL}/api/tasks`, taskData)
    testTaskId = createResponse.data.task._id
    console.log('✅ Task created successfully!')
    console.log('   Task ID:', testTaskId)
    console.log('')

    // 3. Fetch task by ID
    console.log('3. Fetching task by ID...')
    const getResponse = await axios.get(`${BASE_URL}/api/tasks/${testTaskId}`)
    console.log('✅ Task fetched successfully!')
    console.log('   Task Title:', getResponse.data.task.title)
    console.log('   Task Description:', getResponse.data.task.description)
    console.log('   Task Category:', getResponse.data.task.category)
    console.log('   Task Budget:', getResponse.data.task.budget)
    console.log('   Task Status:', getResponse.data.task.status)
    console.log('   Full task:', JSON.stringify(getResponse.data.task, null, 2))
    console.log('')

    // 4. Test with invalid task ID
    console.log('4. Testing with invalid task ID...')
    try {
      await axios.get(`${BASE_URL}/api/tasks/invalid-task-id`)
      console.log('❌ ERROR: Invalid task ID was accepted!')
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Correctly rejected invalid task ID!')
        console.log('   Error:', error.response.data.message)
      } else {
        console.log('❌ Unexpected error:', error.message)
      }
    }
    console.log('')

    // 5. Test with non-existent task ID
    console.log('5. Testing with non-existent task ID...')
    try {
      const fakeId = '696b7d7dca3ceac6163a2f99' // Valid ObjectId format but doesn't exist
      await axios.get(`${BASE_URL}/api/tasks/${fakeId}`)
      console.log('❌ ERROR: Non-existent task ID was accepted!')
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Correctly returned 404 for non-existent task!')
        console.log('   Error:', error.response.data.message)
      } else {
        console.log('❌ Unexpected error:', error.message)
        if (error.response) {
          console.log('   Status:', error.response.status)
          console.log('   Data:', error.response.data)
        }
      }
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

testGetTaskById()

