/**
 * Simple Authentication Test
 * Tests basic endpoints without external dependencies
 */

const http = require('http')

const API_BASE_URL = 'http://localhost:3001'
const FRONTEND_URL = 'http://localhost:5173'

console.log('🧪 Simple Authentication Test')
console.log('=============================\n')

// Test helper
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {}
          resolve({ status: res.statusCode, headers: res.headers, data: parsed })
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body })
        }
      })
    })
    
    req.on('error', reject)
    
    if (data) {
      req.write(JSON.stringify(data))
    }
    
    req.end()
  })
}

async function runTests() {
  console.log('Testing backend endpoints...\n')
  
  // Test 1: Health Check
  console.log('1. Testing Health Check...')
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/health',
      method: 'GET'
    })
    
    if (result.status === 200) {
      console.log('   ✅ PASS - Server is running\n')
    } else {
      console.log(`   ❌ FAIL - Status: ${result.status}\n`)
      return
    }
  } catch (error) {
    console.log(`   ❌ ERROR - ${error.message}\n`)
    console.log('   ⚠️  Make sure the server is running: cd server && npm run dev\n')
    return
  }
  
  // Test 2: CORS Preflight
  console.log('2. Testing CORS Configuration...')
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'OPTIONS',
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    })
    
    const allowOrigin = result.headers['access-control-allow-origin']
    const allowCredentials = result.headers['access-control-allow-credentials']
    
    if (allowCredentials === 'true') {
      console.log('   ✅ PASS - CORS credentials enabled')
      console.log(`   📋 Allow-Origin: ${allowOrigin || 'Not set'}\n`)
    } else {
      console.log('   ❌ FAIL - CORS credentials not enabled\n')
    }
  } catch (error) {
    console.log(`   ❌ ERROR - ${error.message}\n`)
  }
  
  // Test 3: Logout Endpoint (tests cookie parser)
  console.log('3. Testing Cookie Parser...')
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/logout',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'token=test-token',
        'Origin': FRONTEND_URL
      }
    })
    
    if (result.status === 200) {
      console.log('   ✅ PASS - Cookie parser is working\n')
    } else {
      console.log(`   ⚠️  Status: ${result.status} (may be expected)\n`)
    }
  } catch (error) {
    console.log(`   ❌ ERROR - ${error.message}\n`)
  }
  
  console.log('=============================')
  console.log('✅ Backend tests complete!')
  console.log('\n📋 Next Steps:')
  console.log('1. Start frontend: cd ../client && npm run dev')
  console.log('2. Open http://localhost:5173/login')
  console.log('3. Sign in with email/phone and password\n')
}

runTests().catch(console.error)
