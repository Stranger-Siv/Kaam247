# API Test Files

All test files are located in the `/server` directory. Here's what each test file does:

## Test Files Overview

1. **`test-all-apis.js`** - Comprehensive test suite covering all APIs
   - Health check
   - User creation
   - Task creation
   - Task fetching
   - Task acceptance
   - Full integration flow

2. **`test-auth-apis.js`** - Authentication API tests
   - User registration
   - Login with email
   - Login with phone
   - Error handling (duplicate email, wrong password, etc.)

3. **`test-full-integration.js`** - End-to-end integration test
   - Register user → Login → Create task → Fetch tasks

4. **`test-accept-api.js`** - Task acceptance API tests
   - Accept task
   - Prevent duplicate acceptance
   - Error handling

5. **`test-self-accept.js`** - Self-acceptance prevention tests
   - Verify users cannot accept their own tasks

6. **`test-fetch-tasks.js`** - Task fetching API tests
   - Get all available tasks
   - Filter by status

7. **`test-get-task.js`** - Single task retrieval tests
   - Get task by ID
   - Error handling for invalid IDs

8. **`test-socket-worker-tracking.js`** - Socket.IO worker tracking tests
   - Worker online/offline tracking
   - Multiple workers
   - Disconnect handling

9. **`test-api.js`** - Basic API test
   - Simple health check and basic endpoints

## How to Run Tests

### Prerequisites
1. Make sure your server is running on port 3001 (or update BASE_URL in test files)
2. Make sure MongoDB is connected

### Run Individual Tests

```bash
# Navigate to server directory
cd server

# Run all APIs test
node test-all-apis.js

# Run auth APIs test
node test-auth-apis.js

# Run full integration test
node test-full-integration.js

# Run task acceptance test
node test-accept-api.js

# Run self-acceptance prevention test
node test-self-accept.js

# Run task fetching test
node test-fetch-tasks.js

# Run single task retrieval test
node test-get-task.js

# Run socket worker tracking test
node test-socket-worker-tracking.js
```

### Run All Tests (Recommended)

```bash
# Run comprehensive test suite
npm run test:all

# Or run individual test suites
npm run test:auth
npm run test:integration
npm run test:tasks
npm run test:socket
```

## Test Configuration

All test files use `BASE_URL = 'http://localhost:3001'` by default.

To test against a different server, update the `BASE_URL` constant in each test file.

## Notes

- Tests create real data in your database (test users, tasks)
- Some tests use timestamps to create unique emails/phones
- Tests clean up after themselves where possible
- Socket tests require the server to be running with Socket.IO enabled

