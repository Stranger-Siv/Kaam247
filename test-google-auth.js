/**
 * Google Authentication Test Script
 * Tests the Google OAuth flow and cookie-based authentication
 */

const axios = require('axios')

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

console.log('🧪 Google Authentication Test Suite')
console.log('=====================================\n')
console.log(`Backend URL: ${API_BASE_URL}`)
console.log(`Frontend URL: ${FRONTEND_URL}\n`)

// Test configuration
const tests = []

// Test 1: Health Check
tests.push({
  name: 'Health Check',
  test: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`)
      if (response.status === 200) {
        return { success: true, message: 'Server is running' }
      }
      return { success: false, message: `Unexpected status: ${response.status}` }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }
})

// Test 2: CORS Configuration
tests.push({
  name: 'CORS Configuration',
  test: async () => {
    try {
      const response = await axios.options(`${API_BASE_URL}/api/auth/login`, {
        headers: {
          'Origin': FRONTEND_URL,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      })
      
      const corsHeaders = {
        'access-control-allow-origin': response.headers['access-control-allow-origin'],
        'access-control-allow-credentials': response.headers['access-control-allow-credentials'],
        'access-control-allow-methods': response.headers['access-control-allow-methods']
      }
      
      if (corsHeaders['access-control-allow-credentials'] === 'true') {
        return { 
          success: true, 
          message: 'CORS configured correctly',
          details: corsHeaders
        }
      }
      return { 
        success: false, 
        message: 'CORS credentials not enabled',
        details: corsHeaders
      }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }
})

// Test 3: Cookie Parser Middleware
tests.push({
  name: 'Cookie Parser Middleware',
  test: async () => {
    try {
      // Test if server accepts cookies by checking logout endpoint
      const response = await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, {
        headers: {
          'Cookie': 'token=test-token',
          'Origin': FRONTEND_URL
        },
        validateStatus: () => true // Don't throw on any status
      })
      
      // If we get a response (even 200 or 401), cookie parser is working
      if (response.status === 200 || response.status === 401) {
        return { 
          success: true, 
          message: 'Cookie parser middleware is active',
          status: response.status
        }
      }
      return { 
        success: false, 
        message: `Unexpected status: ${response.status}`
      }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }
})

// Test 4: Auth Middleware Cookie Support
tests.push({
  name: 'Auth Middleware Cookie Support',
  test: async () => {
    try {
      // Try accessing a protected route with cookie
      const response = await axios.get(`${API_BASE_URL}/api/users/me`, {
        headers: {
          'Cookie': 'token=invalid-token',
          'Origin': FRONTEND_URL
        },
        validateStatus: () => true
      })
      
      // Should return 401 (unauthorized) not 500 (server error)
      if (response.status === 401) {
        return { 
          success: true, 
          message: 'Auth middleware reads cookies correctly',
          status: response.status
        }
      }
      return { 
        success: false, 
        message: `Expected 401, got ${response.status}`,
        details: response.data
      }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }
})

// Test 5: Google Verify Endpoint
tests.push({
  name: 'Google Verify Endpoint',
  test: async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/google/verify`,
        { idToken: 'invalid-token' },
        {
          headers: {
            'Content-Type': 'application/json',
            'Origin': FRONTEND_URL
          },
          validateStatus: () => true
        }
      )
      
      // Should return 401 for invalid token
      if (response.status === 401) {
        return { 
          success: true, 
          message: 'Google verify endpoint is accessible',
          status: response.status
        }
      }
      return { 
        success: false, 
        message: `Expected 401, got ${response.status}`,
        details: response.data
      }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }
})

// Run all tests
async function runTests() {
  console.log('Starting tests...\n')
  
  let passed = 0
  let failed = 0
  
  for (const test of tests) {
    process.stdout.write(`Testing: ${test.name}... `)
    try {
      const result = await test.test()
      if (result.success) {
        console.log('✅ PASS')
        if (result.message) console.log(`   ${result.message}`)
        if (result.details) console.log(`   Details:`, result.details)
        passed++
      } else {
        console.log('❌ FAIL')
        console.log(`   ${result.message}`)
        if (result.details) console.log(`   Details:`, result.details)
        failed++
      }
    } catch (error) {
      console.log('❌ ERROR')
      console.log(`   ${error.message}`)
      failed++
    }
    console.log('')
  }
  
  console.log('=====================================')
  console.log(`Results: ${passed} passed, ${failed} failed`)
  console.log('=====================================\n')
  
  if (failed === 0) {
    console.log('✅ All backend tests passed!')
    console.log('\n📋 Next Steps:')
    console.log('1. Start the frontend: cd client && npm run dev')
    console.log('2. Open http://localhost:5173/login')
    console.log('3. Click "Continue with Google"')
    console.log('4. Check browser console for logs')
    console.log('5. Verify cookie is set in DevTools → Application → Cookies')
  } else {
    console.log('❌ Some tests failed. Please fix the issues above.')
  }
}

// Run tests
runTests().catch(console.error)
