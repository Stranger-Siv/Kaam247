const axios = require('axios')

const BASE_URL = 'http://localhost:3001'

const testSelfAcceptPrevention = async () => {
  console.log('=== Testing Self-Acceptance Prevention ===\n')

  let testPosterId = ''
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
      name: 'Test Poster for Self-Accept',
      email: `test_poster_self_${Date.now()}@example.com`,
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

    // 3. Create a Task by the Poster
    console.log('3. Creating a Task by the Poster...')
    const taskData = {
      title: 'Test Task for Self-Accept Prevention',
      description: 'This task should not be accepted by its own poster',
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

    // 4. Attempt to Accept Own Task (Should Fail with 403)
    console.log('4. Attempting to Accept Own Task (Should Fail with 403)...')
    try {
      await axios.post(
        `${BASE_URL}/api/tasks/${testTaskId}/accept`,
        { workerId: testPosterId }
      )
      console.log('❌ ERROR: Self-acceptance was allowed! This should not happen.')
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('✅ Correctly prevented self-acceptance!')
        console.log('   Status:', error.response.status)
        console.log('   Error:', error.response.data.error)
        console.log('   Message:', error.response.data.message)
      } else {
        console.log('❌ Unexpected error:', error.response?.status || error.message)
        if (error.response) {
          console.log('   Response:', error.response.data)
        }
      }
    }
    console.log('')

    // 5. Verify Task is Still Available (Status should still be SEARCHING)
    console.log('5. Verifying Task is Still Available...')
    const taskCheckResponse = await axios.get(`${BASE_URL}/api/tasks/${testTaskId}`)
    console.log('✅ Task still available!')
    console.log('   Task Status:', taskCheckResponse.data.task.status)
    if (taskCheckResponse.data.task.status === 'SEARCHING') {
      console.log('✅ Task status is still SEARCHING (correct)')
    } else {
      console.log('❌ ERROR: Task status changed unexpectedly!')
    }
    console.log('')

    // 6. Create a Worker and Accept the Task (Should Succeed)
    console.log('6. Creating a Worker and Accepting the Task (Should Succeed)...')
    const workerData = {
      name: 'Test Worker for Self-Accept',
      email: `test_worker_self_${Date.now()}@example.com`,
      roleMode: 'worker',
      location: {
        coordinates: [77.5946, 12.9352],
        area: 'Koramangala',
        city: 'Bangalore'
      }
    }
    const workerResponse = await axios.post(`${BASE_URL}/api/users`, workerData)
    const workerId = workerResponse.data.user._id
    console.log('   Worker ID:', workerId)

    const acceptResponse = await axios.post(
      `${BASE_URL}/api/tasks/${testTaskId}/accept`,
      { workerId }
    )
    console.log('✅ Task accepted by worker successfully!')
    console.log('   Accepted Task Status:', acceptResponse.data.task.status)
    console.log('   Accepted By:', acceptResponse.data.task.acceptedBy)
    console.log('')

    // 7. Verify Poster Cannot Accept After Worker Accepted (Should Fail with 409)
    console.log('7. Verifying Poster Cannot Accept After Worker Accepted (Should Fail with 409)...')
    try {
      await axios.post(
        `${BASE_URL}/api/tasks/${testTaskId}/accept`,
        { workerId: testPosterId }
      )
      console.log('❌ ERROR: Self-acceptance was allowed after task was accepted!')
    } catch (error) {
      if (error.response && error.response.status === 409) {
        console.log('✅ Correctly rejected (task already accepted)!')
        console.log('   Status:', error.response.status)
        console.log('   Message:', error.response.data.message)
      } else if (error.response && error.response.status === 403) {
        console.log('✅ Correctly rejected (self-acceptance blocked)!')
        console.log('   Status:', error.response.status)
        console.log('   Message:', error.response.data.message)
      } else {
        console.log('❌ Unexpected error:', error.response?.status || error.message)
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

testSelfAcceptPrevention()

