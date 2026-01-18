const io = require('socket.io-client')

const SOCKET_URL = 'http://localhost:3001'

console.log('=== Testing Socket.IO Online Worker Tracking ===')
console.log('='.repeat(60))

// Test 1: Register user as worker
console.log('\n1. TEST: Register user as worker')
console.log('-'.repeat(60))

const workerSocket1 = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: false
})

workerSocket1.on('connect', () => {
  console.log('✅ Worker 1 connected:', workerSocket1.id)
  
  // Register as worker
  workerSocket1.emit('register_user', {
    userId: 'test-worker-1',
    role: 'worker'
  })
  
  setTimeout(() => {
    console.log('   Worker 1 registered as worker')
    
    // Test 2: Toggle worker online
    console.log('\n2. TEST: Toggle worker online')
    console.log('-'.repeat(60))
    workerSocket1.emit('worker_online', { userId: 'test-worker-1' })
    
    setTimeout(() => {
      // Test 3: Register another worker
      console.log('\n3. TEST: Register second worker')
      console.log('-'.repeat(60))
      
      const workerSocket2 = io(SOCKET_URL, {
        autoConnect: true,
        reconnection: false
      })
      
      workerSocket2.on('connect', () => {
        console.log('✅ Worker 2 connected:', workerSocket2.id)
        workerSocket2.emit('register_user', {
          userId: 'test-worker-2',
          role: 'worker'
        })
        
        setTimeout(() => {
          console.log('   Worker 2 registered as worker')
          workerSocket2.emit('worker_online', { userId: 'test-worker-2' })
          
          setTimeout(() => {
            // Test 4: Toggle worker offline
            console.log('\n4. TEST: Toggle worker offline')
            console.log('-'.repeat(60))
            workerSocket1.emit('worker_offline')
            
            setTimeout(() => {
              // Test 5: Disconnect
              console.log('\n5. TEST: Disconnect worker')
              console.log('-'.repeat(60))
              workerSocket2.disconnect()
              
              setTimeout(() => {
                console.log('\n' + '='.repeat(60))
                console.log('✅ Socket.IO Worker Tracking Test Complete!')
                console.log('='.repeat(60))
                console.log('\nCheck server logs for:')
                console.log('- Worker registration messages')
                console.log('- Online/offline status changes')
                console.log('- Total online worker counts')
                console.log('='.repeat(60))
                
                process.exit(0)
              }, 1000)
            }, 1000)
          }, 1000)
        }, 1000)
      })
    }, 1000)
  }, 1000)
})

workerSocket1.on('connect_error', (error) => {
  console.log('❌ Connection error:', error.message)
  console.log('   Make sure the server is running on port 3001')
  process.exit(1)
})

// Timeout after 10 seconds
setTimeout(() => {
  console.log('\n⏱️  Test timeout - check server logs for results')
  process.exit(0)
}, 10000)

