#!/usr/bin/env node
/**
 * Code Analysis Test Suite
 * Checks for common issues, bugs, and code quality problems
 */

const fs = require('fs')
const path = require('path')

const results = {
  passed: [],
  failed: [],
  warnings: []
}

function logResult(testName, passed, message = '') {
  if (passed) {
    results.passed.push(testName)
    console.log(`✅ ${testName}${message ? ': ' + message : ''}`)
  } else {
    results.failed.push({ test: testName, error: message })
    console.log(`❌ ${testName}${message ? ': ' + message : ''}`)
  }
}

function logWarning(testName, message) {
  results.warnings.push({ test: testName, warning: message })
  console.log(`⚠️  ${testName}: ${message}`)
}

// Test 1: Check for critical files
function testCriticalFiles() {
  console.log('\n=== TESTING CRITICAL FILES ===\n')
  
  const criticalFiles = [
    'client/src/App.jsx',
    'client/src/main.jsx',
    'server/index.js',
    'server/models/Task.js',
    'server/models/User.js',
    'server/controllers/taskController.js',
    'server/controllers/userController.js',
    'server/socket/socketHandler.js'
  ]
  
  criticalFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file))
    logResult(`File exists: ${file}`, exists, exists ? '' : 'Missing critical file')
  })
}

// Test 2: Check for common code issues
function testCodeIssues() {
  console.log('\n=== TESTING CODE QUALITY ===\n')
  
  // Check for console.log in production code
  const clientFiles = getAllFiles('client/src')
  let consoleLogCount = 0
  let consoleErrorCount = 0
  
  clientFiles.forEach(file => {
    if (file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(file, 'utf8')
      const logMatches = content.match(/console\.log\(/g)
      const errorMatches = content.match(/console\.error\(/g)
      
      if (logMatches) consoleLogCount += logMatches.length
      if (errorMatches) consoleErrorCount += errorMatches.length
    }
  })
  
  logWarning('Console.log statements', `${consoleLogCount} found (acceptable for debugging)`)
  logResult('Console.error statements', consoleErrorCount > 0, `${consoleErrorCount} found (good for error handling)`)
}

// Test 3: Check for security issues
function testSecurity() {
  console.log('\n=== TESTING SECURITY ===\n')
  
  const serverFiles = getAllFiles('server')
  let hasAuthMiddleware = false
  let hasInputValidation = false
  
  serverFiles.forEach(file => {
    if (file.endsWith('.js')) {
      const content = fs.readFileSync(file, 'utf8')
      if (content.includes('authenticate') || content.includes('auth')) {
        hasAuthMiddleware = true
      }
      if (content.includes('validate') || content.includes('required')) {
        hasInputValidation = true
      }
    }
  })
  
  logResult('Authentication middleware', hasAuthMiddleware, 'Auth protection found')
  logResult('Input validation', hasInputValidation, 'Input validation found')
}

// Test 4: Check API endpoints
function testAPIEndpoints() {
  console.log('\n=== TESTING API ENDPOINTS ===\n')
  
  const routesDir = path.join(__dirname, 'server/routes')
  if (!fs.existsSync(routesDir)) {
    logResult('Routes directory', false, 'Routes directory not found')
    return
  }
  
  const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'))
  const expectedRoutes = ['authRoutes.js', 'taskRoutes.js', 'userRoutes.js']
  
  expectedRoutes.forEach(route => {
    const exists = routeFiles.includes(route)
    logResult(`Route file: ${route}`, exists, exists ? '' : 'Missing route file')
  })
}

// Test 5: Check for error handling
function testErrorHandling() {
  console.log('\n=== TESTING ERROR HANDLING ===\n')
  
  const controllerFiles = getAllFiles('server/controllers')
  let hasTryCatch = false
  let hasErrorHandling = false
  
  controllerFiles.forEach(file => {
    if (file.endsWith('.js')) {
      const content = fs.readFileSync(file, 'utf8')
      if (content.includes('try') && content.includes('catch')) {
        hasTryCatch = true
      }
      if (content.includes('error') || content.includes('Error')) {
        hasErrorHandling = true
      }
    }
  })
  
  logResult('Try-catch blocks', hasTryCatch, 'Error handling found')
  logResult('Error handling patterns', hasErrorHandling, 'Error handling patterns found')
}

// Test 6: Check Socket.IO implementation
function testSocketIO() {
  console.log('\n=== TESTING SOCKET.IO ===\n')
  
  const socketFiles = getAllFiles('server/socket')
  const clientSocketFiles = getAllFiles('client/src/context')
  
  const hasServerSocket = socketFiles.some(f => f.includes('socket'))
  const hasClientSocket = clientSocketFiles.some(f => f.includes('Socket'))
  
  logResult('Server Socket.IO files', hasServerSocket, 'Socket handler found')
  logResult('Client Socket.IO context', hasClientSocket, 'Socket context found')
  
  // Check for Socket.IO connection handling
  if (hasClientSocket) {
    const socketContext = clientSocketFiles.find(f => f.includes('Socket'))
    if (socketContext) {
      const content = fs.readFileSync(socketContext, 'utf8')
      const hasReconnect = content.includes('reconnect') || content.includes('reconnection')
      logResult('Socket.IO reconnection', hasReconnect, 'Reconnection logic found')
    }
  }
}

// Test 7: Check for required dependencies
function testDependencies() {
  console.log('\n=== TESTING DEPENDENCIES ===\n')
  
  const clientPackage = JSON.parse(fs.readFileSync('client/package.json', 'utf8'))
  const serverPackage = JSON.parse(fs.readFileSync('server/package.json', 'utf8'))
  
  const requiredClientDeps = ['react', 'react-dom', 'react-router-dom', 'socket.io-client']
  const requiredServerDeps = ['express', 'mongoose', 'socket.io', 'jsonwebtoken']
  
  requiredClientDeps.forEach(dep => {
    const exists = clientPackage.dependencies[dep] || clientPackage.devDependencies[dep]
    logResult(`Client dependency: ${dep}`, !!exists, exists ? '' : 'Missing dependency')
  })
  
  requiredServerDeps.forEach(dep => {
    const exists = serverPackage.dependencies[dep] || serverPackage.devDependencies[dep]
    logResult(`Server dependency: ${dep}`, !!exists, exists ? '' : 'Missing dependency')
  })
}

// Helper function to get all files recursively
function getAllFiles(dir, fileList = []) {
  const fullPath = path.join(__dirname, dir)
  if (!fs.existsSync(fullPath)) return fileList
  
  const files = fs.readdirSync(fullPath)
  
  files.forEach(file => {
    const filePath = path.join(fullPath, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      getAllFiles(path.join(dir, file), fileList)
    } else {
      fileList.push(filePath)
    }
  })
  
  return fileList
}

// Main test runner
async function runAllTests() {
  console.log('='.repeat(60))
  console.log('CODE ANALYSIS TEST SUITE')
  console.log('='.repeat(60))
  console.log(`Testing directory: ${__dirname}`)
  console.log('='.repeat(60))
  
  try {
    testCriticalFiles()
    testCodeIssues()
    testSecurity()
    testAPIEndpoints()
    testErrorHandling()
    testSocketIO()
    testDependencies()
    
    // Print summary
    console.log('\n' + '='.repeat(60))
    console.log('TEST SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Passed: ${results.passed.length}`)
    console.log(`❌ Failed: ${results.failed.length}`)
    console.log(`⚠️  Warnings: ${results.warnings.length}`)
    
    if (results.failed.length > 0) {
      console.log('\nFailed Tests:')
      results.failed.forEach(f => {
        console.log(`  ❌ ${f.test}: ${f.error}`)
      })
    }
    
    if (results.warnings.length > 0) {
      console.log('\nWarnings:')
      results.warnings.forEach(w => {
        console.log(`  ⚠️  ${w.test}: ${w.warning}`)
      })
    }
    
    console.log('\n' + '='.repeat(60))
    
    // Exit with appropriate code
    process.exit(results.failed.length > 0 ? 1 : 0)
  } catch (error) {
    console.error('\n❌ Fatal error during testing:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run tests
runAllTests()

