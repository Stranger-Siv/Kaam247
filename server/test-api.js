const axios = require('axios')

const BASE_URL = 'http://localhost:3001'

async function testAPI() {
  console.log('=== Testing Kaam247 API ===\n')

  // Test 1: Health Check
  console.log('1. Testing Health Endpoint...')
  try {
    const healthResponse = await axios.get(`${BASE_URL}/health`)
    console.log('✅ Health check passed:', healthResponse.data)
  } catch (error) {
    console.log('❌ Health check failed:', error.message)
    if (error.code === 'ECONNREFUSED') {
      console.log('   Server is not running. Please start the server first.')
      return
    }
  }

  // Test 2: Create a User
  console.log('\n2. Creating a Test User...')
  const testUser = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    phone: '+91 9876543210',
    roleMode: 'poster',
    location: {
      coordinates: [77.5946, 12.9352],
      area: 'Koramangala',
      city: 'Bangalore'
    }
  }

  let userId = null
  try {
    console.log('Sending user creation request...')
    const userResponse = await axios.post(`${BASE_URL}/api/users`, testUser, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    console.log('✅ User created successfully!')
    userId = userResponse.data.user._id
    console.log('User ID:', userId)
  } catch (error) {
    if (error.response) {
      console.log('❌ User creation failed')
      console.log('Status:', error.response.status)
      console.log('Error:', JSON.stringify(error.response.data, null, 2))
      console.log('\n⚠️  Cannot test task creation without a valid user.')
      return
    } else {
      console.log('❌ Request failed:', error.message)
      return
    }
  }

  // Test 3: Create a Task with the new user
  console.log('\n3. Testing Task Creation Endpoint...')
  const testTask = {
    title: 'Test Task - API Testing',
    description: 'This is a test task created via API test script',
    category: 'Cleaning',
    budget: 500,
    location: {
      coordinates: [77.5946, 12.9352],
      area: 'Koramangala',
      city: 'Bangalore'
    },
    postedBy: userId
  }

  try {
    console.log('Sending task creation request...')
    const response = await axios.post(`${BASE_URL}/api/tasks`, testTask, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    console.log('✅ Task created successfully!')
    console.log('Response:', JSON.stringify(response.data, null, 2))
    console.log('\n✅ All tests passed!')
  } catch (error) {
    if (error.response) {
      console.log('❌ Task creation failed')
      console.log('Status:', error.response.status)
      console.log('Error:', JSON.stringify(error.response.data, null, 2))
    } else {
      console.log('❌ Request failed:', error.message)
    }
  }

  console.log('\n=== Test Complete ===')
}

testAPI()
