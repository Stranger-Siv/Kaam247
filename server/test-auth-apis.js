const axios = require('axios')

const BASE_URL = 'http://localhost:3001'

const testAuth = async () => {
  console.log('=== Testing Kaam247 Auth APIs ===')
  console.log('='.repeat(60))

  let testToken = ''
  let testUserId = ''

  // ============================================
  // 1. TEST REGISTRATION
  // ============================================
  console.log('\n1. USER REGISTRATION API')
  console.log('-'.repeat(60))

  const testEmail = `test_user_${Date.now()}@kaam247.com`
  const testPhone = `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`

  try {
    const registerData = {
      name: 'Test User - Auth Test',
      email: testEmail,
      phone: testPhone,
      password: 'testpassword123'
    }

    const response = await axios.post(`${BASE_URL}/api/auth/register`, registerData)
    testToken = response.data.token
    testUserId = response.data.user._id

    console.log('✅ POST /api/auth/register')
    console.log('   Status:', response.status)
    console.log('   User ID:', testUserId)
    console.log('   Name:', response.data.user.name)
    console.log('   Email:', response.data.user.email)
    console.log('   Phone:', response.data.user.phone)
    console.log('   Token received:', testToken ? 'Yes' : 'No')
    console.log('   Token length:', testToken ? testToken.length : 0)
  } catch (error) {
    console.log('❌ POST /api/auth/register FAILED')
    console.log('   Status:', error.response?.status)
    console.log('   Error:', error.response?.data || error.message)
    process.exit(1)
  }

  // ============================================
  // 2. TEST REGISTRATION WITH DUPLICATE EMAIL
  // ============================================
  console.log('\n2. REGISTRATION WITH DUPLICATE EMAIL')
  console.log('-'.repeat(60))

  try {
    const duplicateData = {
      name: 'Duplicate User',
      email: testEmail, // Same email as above
      phone: `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      password: 'password123'
    }

    await axios.post(`${BASE_URL}/api/auth/register`, duplicateData)
    console.log('❌ POST /api/auth/register (Duplicate) - Expected failure, but succeeded')
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ POST /api/auth/register (Duplicate) - Correctly rejected')
      console.log('   Status:', error.response.status)
      console.log('   Message:', error.response.data.message)
    } else {
      console.log('❌ POST /api/auth/register (Duplicate) - Unexpected error')
      console.log('   Status:', error.response?.status)
      console.log('   Error:', error.response?.data || error.message)
    }
  }

  // ============================================
  // 3. TEST REGISTRATION WITH INVALID DATA
  // ============================================
  console.log('\n3. REGISTRATION WITH INVALID DATA')
  console.log('-'.repeat(60))

  try {
    await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Invalid User'
      // Missing email, phone, password
    })
    console.log('❌ POST /api/auth/register (Invalid) - Expected failure, but succeeded')
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ POST /api/auth/register (Invalid) - Correctly rejected')
      console.log('   Status:', error.response.status)
      console.log('   Message:', error.response.data.message)
    } else {
      console.log('❌ POST /api/auth/register (Invalid) - Unexpected error')
      console.log('   Status:', error.response?.status)
      console.log('   Error:', error.response?.data || error.message)
    }
  }

  // ============================================
  // 4. TEST LOGIN WITH EMAIL
  // ============================================
  console.log('\n4. LOGIN WITH EMAIL')
  console.log('-'.repeat(60))

  try {
    const loginData = {
      identifier: testEmail,
      password: 'testpassword123'
    }

    const response = await axios.post(`${BASE_URL}/api/auth/login`, loginData)
    const loginToken = response.data.token

    console.log('✅ POST /api/auth/login (Email)')
    console.log('   Status:', response.status)
    console.log('   User ID:', response.data.user._id)
    console.log('   Name:', response.data.user.name)
    console.log('   Token received:', loginToken ? 'Yes' : 'No')
    console.log('   Token matches:', loginToken === testToken ? 'Yes' : 'No (new token generated)')
  } catch (error) {
    console.log('❌ POST /api/auth/login (Email) FAILED')
    console.log('   Status:', error.response?.status)
    console.log('   Error:', error.response?.data || error.message)
  }

  // ============================================
  // 5. TEST LOGIN WITH PHONE
  // ============================================
  console.log('\n5. LOGIN WITH PHONE')
  console.log('-'.repeat(60))

  try {
    const loginData = {
      identifier: testPhone,
      password: 'testpassword123'
    }

    const response = await axios.post(`${BASE_URL}/api/auth/login`, loginData)
    const loginToken = response.data.token

    console.log('✅ POST /api/auth/login (Phone)')
    console.log('   Status:', response.status)
    console.log('   User ID:', response.data.user._id)
    console.log('   Name:', response.data.user.name)
    console.log('   Token received:', loginToken ? 'Yes' : 'No')
  } catch (error) {
    console.log('❌ POST /api/auth/login (Phone) FAILED')
    console.log('   Status:', error.response?.status)
    console.log('   Error:', error.response?.data || error.message)
  }

  // ============================================
  // 6. TEST LOGIN WITH WRONG PASSWORD
  // ============================================
  console.log('\n6. LOGIN WITH WRONG PASSWORD')
  console.log('-'.repeat(60))

  try {
    const loginData = {
      identifier: testEmail,
      password: 'wrongpassword'
    }

    await axios.post(`${BASE_URL}/api/auth/login`, loginData)
    console.log('❌ POST /api/auth/login (Wrong Password) - Expected failure, but succeeded')
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ POST /api/auth/login (Wrong Password) - Correctly rejected')
      console.log('   Status:', error.response.status)
      console.log('   Message:', error.response.data.message)
    } else {
      console.log('❌ POST /api/auth/login (Wrong Password) - Unexpected error')
      console.log('   Status:', error.response?.status)
      console.log('   Error:', error.response?.data || error.message)
    }
  }

  // ============================================
  // 7. TEST LOGIN WITH NON-EXISTENT USER
  // ============================================
  console.log('\n7. LOGIN WITH NON-EXISTENT USER')
  console.log('-'.repeat(60))

  try {
    const loginData = {
      identifier: 'nonexistent@kaam247.com',
      password: 'password123'
    }

    await axios.post(`${BASE_URL}/api/auth/login`, loginData)
    console.log('❌ POST /api/auth/login (Non-existent) - Expected failure, but succeeded')
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ POST /api/auth/login (Non-existent) - Correctly rejected')
      console.log('   Status:', error.response.status)
      console.log('   Message:', error.response.data.message)
    } else {
      console.log('❌ POST /api/auth/login (Non-existent) - Unexpected error')
      console.log('   Status:', error.response?.status)
      console.log('   Error:', error.response?.data || error.message)
    }
  }

  // ============================================
  // 8. TEST LOGIN WITH MISSING FIELDS
  // ============================================
  console.log('\n8. LOGIN WITH MISSING FIELDS')
  console.log('-'.repeat(60))

  try {
    await axios.post(`${BASE_URL}/api/auth/login`, {
      identifier: testEmail
      // Missing password
    })
    console.log('❌ POST /api/auth/login (Missing Fields) - Expected failure, but succeeded')
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ POST /api/auth/login (Missing Fields) - Correctly rejected')
      console.log('   Status:', error.response.status)
      console.log('   Message:', error.response.data.message)
    } else {
      console.log('❌ POST /api/auth/login (Missing Fields) - Unexpected error')
      console.log('   Status:', error.response?.status)
      console.log('   Error:', error.response?.data || error.message)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ Auth API Testing Complete!')
  console.log('='.repeat(60))
}

// Run tests
testAuth().catch(error => {
  console.error('Test execution error:', error.message)
  process.exit(1)
})

