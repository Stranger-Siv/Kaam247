# Background (fire-and-forget) tasks

Non-critical work is run **after** the API response is sent so it does not block response time or add MongoDB/CPU load during the request.

## Utility

- **Location:** `server/utils/background.js`
- **API:** `runAfterResponse(label, fn)`
  - Schedules `fn` with `setImmediate` (next tick). The handler returns and Express sends the response first; then `fn` runs.
  - `fn` can be sync or async. If it returns a Promise, rejections are caught and logged with `[background] <label>`.
  - Sync throws in `fn` are caught and logged. No unhandled rejections.

## Tasks moved out of request lifecycle

| Handler | Background work |
|---------|------------------|
| **taskController** | |
| createTask | `lastAlertedAt` update (Task.updateOne), cache invalidation, broadcastNewTask |
| acceptTask | Cache invalidation, notifyTaskAccepted, notifyTaskRemoved, notifyTaskStatusChanged |
| cancelTask (poster) | Cache invalidation, notifyTaskCancelled, notifyTaskStatusChanged, notifyTaskRemoved |
| cancelTask (worker) | Cache invalidation, notifyTaskCancelled, notifyTaskStatusChanged |
| startTask | Cache invalidation, notifyTaskStatusChanged, notifyTaskUpdated |
| markComplete | Cache invalidation, notifyTaskStatusChanged, notifyTaskUpdated |
| confirmComplete | Cache invalidation, notifyTaskCompleted, notifyTaskStatusChanged, notifyTaskUpdated |
| editTask (both branches) | broadcastNewTask (if re-alert), notifyTaskUpdated, notifyTaskStatusChanged |
| deleteTask | notifyTaskRemoved, notifyTaskStatusChanged |
| duplicateTask | broadcastNewTask |
| bulkCancelTasks | Cache invalidation, notifyTaskCancelled, notifyTaskStatusChanged per task |
| bulkDeleteTasks | notifyTaskRemoved per taskId |
| **adminController** | |
| blockUser | notifyUserUpdated, notifyAdminStatsRefresh, invalidateStatsAndAdminDashboards |
| unblockUser | same |
| banUser | same |
| resetCancellations | notifyAdminStatsRefresh |
| updateCancelLimit | notifyUserUpdated, notifyAdminStatsRefresh |
| cancelTask (admin) | notifyTaskCancelled (poster + worker), notifyTaskUpdated, notifyAdminStatsRefresh, invalidateStatsAndAdminDashboards |
| unassignTask | notifyTaskUpdated, notifyAdminStatsRefresh, invalidateStatsAndAdminDashboards |
| hideTask | invalidateStatsAndAdminDashboards |
| **chatController** | |
| sendMessage | emitReceiveMessage, sendPushToUser |
| **supportTicketController** | |
| sendMessage (user) | emitTicketMessage |
| sendAdminTicketMessage | emitTicketMessage |

## MongoDB in background

- **createTask:** `Task.updateOne({ _id }, { $set: { lastAlertedAt } })` — minimal update, no read-before-write.
- Cache invalidation is in-memory only (no DB).
- Socket and push calls are I/O but do not block the response.

## Confirmation

- API responses are sent with `res.status(...).json(...)` **before** any `runAfterResponse` callback runs, because the callback is scheduled with `setImmediate` and runs in the next tick after the handler returns.
- Errors in background tasks are caught and logged; they do not affect the HTTP response or cause unhandled promise rejections.

## Admin logs / analytics

- **AdminLog** is currently only read (getLogs). When adding admin action logging (e.g. “admin X cancelled task Y”), create the log entry inside `runAfterResponse` so the write does not block the response. Prefer a single `AdminLog.create({ ... })` or `insertOne`; avoid read-before-write.
