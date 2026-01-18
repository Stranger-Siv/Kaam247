const axios = require('axios')

const BASE_URL = 'http://localhost:3001'

const testAcceptAPI = async () => {
  console.log('=== Testing Kaam247 Task Acceptance API ===\n')

  let testPosterId = ''
  let testWorkerId = ''
  let testTaskId = ''

  try {
    // 1. Test Health Endpoint
    console.log('1. Testing Health Endpoint...')
    const healthResponse = await axios.get(`${BASE_URL}/health`)
    console.log('✅ Health check passed:', healthResponse.data.message)
    console.log('')

    // 2. Create a Test Poster User
    console.log('2. Creating a Test Poster User...')
    const posterData = {
      name: 'Test Poster',
      email: `test_poster_${Date.now()}@example.com`,
      roleMode: 'poster',
      location: {
        coordinates: [77.5946, 12.9352],
        area: 'Koramangala',
        city: 'Bangalore'
      }
    }
    const posterResponse = await axios.post(`${BASE_URL}/api/users`, posterData)
    testPosterId = posterResponse.data.user._id
    console.log('✅ Poster created successfully!')
    console.log('   Poster ID:', testPosterId)
    console.log('')

    // 3. Create a Test Worker User
    console.log('3. Creating a Test Worker User...')
    const workerData = {
      name: 'Test Worker',
      email: `test_worker_${Date.now()}@example.com`,
      roleMode: 'worker',
      location: {
        coordinates: [77.5946, 12.9352],
        area: 'Koramangala',
        city: 'Bangalore'
      }
    }
    const workerResponse = await axios.post(`${BASE_URL}/api/users`, workerData)
    testWorkerId = workerResponse.data.user._id
    console.log('✅ Worker created successfully!')
    console.log('   Worker ID:', testWorkerId)
    console.log('')

    // 4. Create a Test Task
    console.log('4. Creating a Test Task...')
    const taskData = {
      title: 'Test Task - API Acceptance Testing',
      description: 'This is a test task for acceptance API testing',
      category: 'Cleaning',
      budget: 500,
      location: {
        coordinates: [77.5946, 12.9352],
        area: 'Koramangala',
        city: 'Bangalore'
      },
      postedBy: testPosterId
    }
    const taskResponse = await axios.post(`${BASE_URL}/api/tasks`, taskData)
    testTaskId = taskResponse.data.task._id
    console.log('✅ Task created successfully!')
    console.log('   Task ID:', testTaskId)
    console.log('   Task Status:', taskResponse.data.task.status)
    console.log('')

    // 5. Accept the Task
    console.log('5. Accepting the Task...')
    const acceptData = {
      workerId: testWorkerId
    }
    const acceptResponse = await axios.post(
      `${BASE_URL}/api/tasks/${testTaskId}/accept`,
      acceptData
    )
    console.log('✅ Task accepted successfully!')
    console.log('   Accepted Task ID:', acceptResponse.data.task._id)
    console.log('   Accepted By:', acceptResponse.data.task.acceptedBy)
    console.log('   New Status:', acceptResponse.data.task.status)
    console.log('')

    // 6. Try to Accept the Same Task Again (Should Fail)
    console.log('6. Attempting to Accept Already Accepted Task (Should Fail)...')
    try {
      await axios.post(
        `${BASE_URL}/api/tasks/${testTaskId}/accept`,
        { workerId: testWorkerId }
      )
      console.log('❌ ERROR: Task was accepted twice! This should not happen.')
    } catch (error) {
      if (error.response && error.response.status === 409) {
        console.log('✅ Correctly rejected duplicate acceptance!')
        console.log('   Error:', error.response.data.message)
      } else {
        console.log('❌ Unexpected error:', error.message)
      }
    }
    console.log('')

    // 7. Test Invalid Task ID
    console.log('7. Testing Invalid Task ID...')
    try {
      await axios.post(
        `${BASE_URL}/api/tasks/invalid-task-id/accept`,
        { workerId: testWorkerId }
      )
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

    // 8. Test Invalid Worker ID
    console.log('8. Testing Invalid Worker ID...')
    try {
      const newTaskData = {
        title: 'Another Test Task',
        description: 'Test task for invalid worker test',
        category: 'Delivery',
        budget: 300,
        location: {
          coordinates: [77.5946, 12.9352],
          area: 'Koramangala',
          city: 'Bangalore'
        },
        postedBy: testPosterId
      }
      const newTaskResponse = await axios.post(`${BASE_URL}/api/tasks`, newTaskData)
      const newTaskId = newTaskResponse.data.task._id

      await axios.post(
        `${BASE_URL}/api/tasks/${newTaskId}/accept`,
        { workerId: 'invalid-worker-id' }
      )
      console.log('❌ ERROR: Invalid worker ID was accepted!')
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Correctly rejected invalid worker ID!')
        console.log('   Error:', error.response.data.message)
      } else {
        console.log('❌ Unexpected error:', error.message)
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

testAcceptAPI()

