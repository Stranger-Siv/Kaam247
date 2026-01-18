# API Testing Guide

## Quick Test - Run All APIs

```bash
cd server
npm run test:comprehensive
```

Or directly:
```bash
node test-all-apis-comprehensive.js
```

## What the Test Does

1. **Health Check** - Verifies backend is running
2. **Auth APIs** - Tests registration and login for both poster and worker
3. **User APIs** - Tests profile, activity, earnings, active task endpoints
4. **Task APIs** - Tests task creation, fetching, filtering
5. **Socket.IO Alerts** - **CRITICAL TEST** - Tests if workers receive real-time alerts when tasks are created
6. **Task Acceptance** - Tests task acceptance flow
7. **Report API** - Tests reporting functionality

## Alert System Test Details

The Socket.IO alert test:
1. Connects a worker socket
2. Registers worker as online with location
3. Creates a new task
4. Waits up to 10 seconds for `new_task` alert
5. Verifies alert is received with correct data

## Common Issues & Fixes

### Alert Not Working?

1. **Check Worker Status**
   - Worker must be online (toggle switched on in UI)
   - Worker must have location enabled
   - Socket must be connected

2. **Check Task Status**
   - Task must have status `OPEN` or `SEARCHING`
   - Task must not be hidden (`isHidden: false`)

3. **Check Location**
   - Worker and task must be within 5km radius (default)
   - Both must have valid coordinates

4. **Check Socket Connection**
   - Worker must emit `worker_online` event after connecting
   - Worker must emit `clientConnected` event

5. **Check Backend Logs**
   - Look for "Error broadcasting new task" messages
   - Check if `getOnlineWorkerCount()` returns > 0
   - Verify `getAllWorkersWithLocations()` returns workers

## Manual Testing Steps

1. **Start Backend**
   ```bash
   cd server
   npm run dev
   ```

2. **Run Tests**
   ```bash
   npm run test:comprehensive
   ```

3. **Check Results**
   - All tests should pass ✅
   - Socket alert test should receive alert within 10 seconds
   - If alert fails, check backend console for errors

## Debugging Alert Issues

If alerts aren't working:

1. **Check Socket Manager**
   ```javascript
   // In backend console, check:
   socketManager.getOnlineWorkerCount() // Should be > 0
   socketManager.getAllWorkersWithLocations() // Should return workers with locations
   ```

2. **Check Task Creation**
   - Verify task is created with status `OPEN`
   - Verify task has valid location coordinates
   - Verify `broadcastNewTask` is called

3. **Check Worker Registration**
   - Verify worker emits `worker_online` with location
   - Verify `socketManager.addOnlineWorker` is called
   - Verify worker location is stored correctly

4. **Check Distance Calculation**
   - Verify worker and task coordinates are valid
   - Verify distance is calculated correctly
   - Verify worker is within radius

## Expected Test Output

```
============================================================
COMPREHENSIVE API TEST SUITE
============================================================
Base URL: http://localhost:3001
Socket URL: http://localhost:3001
============================================================

✅ Health Check
✅ Register Poster
✅ Register Worker
✅ Login Poster
✅ Login Worker
✅ Get Profile
✅ Get Activity
✅ Get Earnings
✅ Get Active Task
✅ Get Cancellation Status
✅ Create Task: Task ID: 507f1f77bcf86cd799439011
✅ Get Available Tasks (no location): Found 1 tasks
✅ Get Available Tasks (with location): Found 1 tasks (includes our task)
✅ Get Task By ID
✅ Get Tasks By User: Found 1 tasks (includes our task)

=== TESTING SOCKET.IO ALERTS ===

✅ Worker socket connected
✅ Worker registered as online
✅ Task created for alert test
   Waiting for alert... (max 10 seconds)
✅ NEW TASK ALERT RECEIVED!
   Task ID: 507f1f77bcf86cd799439012
   Title: Socket Alert Test Task
   Budget: 300
   Distance: 0.0 km
✅ Socket Alert - new_task event: Received alert for task: Socket Alert Test Task

============================================================
TEST SUMMARY
============================================================
✅ Passed: 20
❌ Failed: 0
⚠️  Warnings: 0
============================================================
```

## Environment Variables

You can set these before running tests:

```bash
export API_BASE_URL=http://localhost:3001
export SOCKET_URL=http://localhost:3001
npm run test:comprehensive
```

For production testing:
```bash
export API_BASE_URL=https://your-backend.onrender.com
export SOCKET_URL=https://your-backend.onrender.com
npm run test:comprehensive
```

