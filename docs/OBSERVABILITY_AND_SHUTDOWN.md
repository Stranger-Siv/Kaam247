# Observability and Graceful Shutdown

Lightweight, non-APM observability and safety mechanisms for the Node.js backend.

## 1. Request-level performance logging

**Middleware:** `server/middleware/requestTiming.js`

- Logs any API request that takes **>500ms**.
- Log line: `[slow] METHOD path STATUS durationMs`
- Logging is deferred with `setImmediate()` so it does not block the response.
- No per-request overhead under the threshold; no extra memory beyond a single `start` timestamp per request.

## 2. MongoDB slow-query logging

**Setup:** `server/config/db.js` (after successful connect)

- **Driver:** `monitorCommands: true` in Mongoose connect options so the MongoDB Node driver emits command events.
- Logs any command that takes **>200ms**.
- Log line: `[slow-query] commandName collectionName durationMs`
- **No query payloads or document content are logged** (only collection name and operation type).
- A small in-memory map (capped at 5000 entries) links `commandStarted` to `commandSucceeded` to resolve collection name; entries are removed on success/failure to avoid leaks.

## 3. Global error handling

**Middleware:** `server/middleware/errorHandler.js` (4-arg Express error handler)

- Invoked when any route or middleware calls `next(err)`.
- Response: JSON `{ error, message }` with appropriate status (`err.statusCode` or 500).
- In production, 5xx responses hide internal message; in development, `statusCode` and full message are included.
- 5xx errors are logged (method, path, status, message); stack only in non-production.

**Process-level:**

- **uncaughtException:** Logged, then `process.exit(1)` (process state is considered undefined).
- **unhandledRejection:** Logged only; process is not exited to avoid unnecessary restarts. Fix promise chains so rejections are handled or passed to the error handler where possible.

## 4. Graceful shutdown

**In:** `server/index.js`

- Listens for **SIGTERM** and **SIGINT**.
- Stops accepting new connections via `server.close()`.
- Waits for in-flight HTTP requests to finish (driver default behavior).
- Closes the MongoDB connection with `disconnectDB()`.
- Exits with `0` on success, `1` on error.
- **Timeout:** If shutdown does not complete within 15 seconds, the process is force-exited with `1` to avoid hung deploys (e.g. on Render).

## Summary

| Mechanism            | Threshold / trigger | Log prefix    | Blocking? |
|---------------------|----------------------|---------------|-----------|
| Slow request        | >500ms               | `[slow]`      | No        |
| Slow MongoDB query  | >200ms               | `[slow-query]`| No        |
| Route error         | `next(err)`          | `[error]`     | No        |
| Shutdown            | SIGTERM/SIGINT      | `[shutdown]`  | N/A       |

Logs are concise and only emitted when needed (slow requests, slow queries, errors, shutdown), so normal traffic does not produce excessive log volume.
