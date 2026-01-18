/**
 * API Test Script for Kaam247
 * 
 * Run this in browser console on https://kaam247.in or localhost
 * Tests all API endpoints to ensure they work correctly
 */

const API_BASE_URL = window.location.hostname.includes('localhost') 
  ? 'http://localhost:3001' 
  : 'https://kaam247.onrender.com'

const token = localStorage.getItem('kaam247_token')
const user = JSON.parse(localStorage.getItem('kaam247_user') || 'null')

console.log('🧪 Starting API Tests...')
console.log('API Base URL:', API_BASE_URL)
console.log('User:', user?.email || 'Not logged in')
console.log('Token:', token ? 'Present' : 'Missing')
console.log('')

const tests = []

// Test 1: Health Check
async function testHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    const data = await response.json()
    tests.push({ name: 'Health Check', status: response.ok ? '✅ PASS' : '❌ FAIL', data })
    return response.ok
  } catch (error) {
    tests.push({ name: 'Health Check', status: '❌ FAIL', error: error.message })
    return false
  }
}

// Test 2: Get User Profile (requires auth)
async function testGetProfile() {
  if (!token) {
    tests.push({ name: 'Get Profile', status: '⏭️ SKIP', reason: 'Not logged in' })
    return false
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await response.json()
    tests.push({ name: 'Get Profile', status: response.ok ? '✅ PASS' : '❌ FAIL', data: response.ok ? 'User data received' : data })
    return response.ok
  } catch (error) {
    tests.push({ name: 'Get Profile', status: '❌ FAIL', error: error.message })
    return false
  }
}

// Test 3: Get Earnings (requires auth)
async function testGetEarnings() {
  if (!token) {
    tests.push({ name: 'Get Earnings', status: '⏭️ SKIP', reason: 'Not logged in' })
    return false
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/me/earnings`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await response.json()
    tests.push({ name: 'Get Earnings', status: response.ok ? '✅ PASS' : '❌ FAIL', data: response.ok ? 'Earnings data received' : data })
    return response.ok
  } catch (error) {
    tests.push({ name: 'Get Earnings', status: '❌ FAIL', error: error.message })
    return false
  }
}

// Test 4: Get Activity (requires auth)
async function testGetActivity() {
  if (!token) {
    tests.push({ name: 'Get Activity', status: '⏭️ SKIP', reason: 'Not logged in' })
    return false
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/me/activity`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await response.json()
    tests.push({ name: 'Get Activity', status: response.ok ? '✅ PASS' : '❌ FAIL', data: response.ok ? 'Activity data received' : data })
    return response.ok
  } catch (error) {
    tests.push({ name: 'Get Activity', status: '❌ FAIL', error: error.message })
    return false
  }
}

// Test 5: Get Tasks (public endpoint)
async function testGetTasks() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks`)
    const data = await response.json()
    tests.push({ name: 'Get Tasks', status: response.ok ? '✅ PASS' : '❌ FAIL', data: response.ok ? `${data.tasks?.length || 0} tasks received` : data })
    return response.ok
  } catch (error) {
    tests.push({ name: 'Get Tasks', status: '❌ FAIL', error: error.message })
    return false
  }
}

// Test 6: Get Active Task (requires auth)
async function testGetActiveTask() {
  if (!token) {
    tests.push({ name: 'Get Active Task', status: '⏭️ SKIP', reason: 'Not logged in' })
    return false
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/me/active-task`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await response.json()
    tests.push({ name: 'Get Active Task', status: response.ok ? '✅ PASS' : '❌ FAIL', data: response.ok ? (data.task ? 'Active task found' : 'No active task') : data })
    return response.ok
  } catch (error) {
    tests.push({ name: 'Get Active Task', status: '❌ FAIL', error: error.message })
    return false
  }
}

// Test 7: Check Socket.IO (should fail gracefully)
async function testSocket() {
  try {
    // Socket is disabled, so this should not connect
    tests.push({ name: 'Socket.IO', status: '⏭️ SKIP', reason: 'Socket disabled (SOCKET_ENABLED=false)' })
    return true
  } catch (error) {
    tests.push({ name: 'Socket.IO', status: '❌ FAIL', error: error.message })
    return false
  }
}

// Run all tests
async function runAllTests() {
  console.log('Running tests...\n')
  
  await testHealth()
  await testGetProfile()
  await testGetEarnings()
  await testGetActivity()
  await testGetTasks()
  await testGetActiveTask()
  await testSocket()
  
  console.log('\n📊 Test Results:')
  console.log('='.repeat(50))
  tests.forEach(test => {
    console.log(`${test.status} - ${test.name}`)
    if (test.error) console.log(`   Error: ${test.error}`)
    if (test.reason) console.log(`   Reason: ${test.reason}`)
  })
  console.log('='.repeat(50))
  
  const passed = tests.filter(t => t.status === '✅ PASS').length
  const failed = tests.filter(t => t.status === '❌ FAIL').length
  const skipped = tests.filter(t => t.status === '⏭️ SKIP').length
  
  console.log(`\n✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⏭️  Skipped: ${skipped}`)
  console.log(`📊 Total: ${tests.length}`)
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed!')
  } else {
    console.log('\n⚠️  Some tests failed. Check errors above.')
  }
}

// Export for use
if (typeof window !== 'undefined') {
  window.testKaam247APIs = runAllTests
  console.log('💡 Run testKaam247APIs() in console to test all APIs')
}

// Auto-run if executed directly
if (typeof window !== 'undefined' && window.location.href.includes('localhost')) {
  runAllTests()
}

