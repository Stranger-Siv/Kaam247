# API Response Optimization

This document describes response-size and bandwidth optimizations: gzip compression and reduced payloads for list/detail endpoints.

## 1. Compression Middleware

**Location:** `server/index.js`

- **Library:** `compression` (Express middleware)
- **Config:** gzip with `level: 6` (balance of speed vs ratio)
- **Scope:** All responses; the built-in filter skips non-compressible types (e.g. already-compressed, images)
- **Opt-out:** Requests with `x-no-compression: 1` (or any truthy value) are not compressed

```js
app.use(compression({ level: 6, filter: (req, res) => {
  if (req.headers['x-no-compression']) return false
  return compression.filter(req, res)
}}))
```

Ensure `compression` is registered **before** route handlers so JSON/text responses are compressed.

## 2. Endpoints with Reduced Payloads

| Endpoint | Change | Notes |
|----------|--------|--------|
| **GET /api/tasks** | List uses `listFields` only; geo path uses `$project` with fixed fields | No full task docs in list |
| **GET /api/tasks/:taskId** | `__v` stripped from task and from nested `postedBy` / `acceptedBy` | Same shape, smaller payload |
| **GET /api/tasks/user/:userId** | List uses `listFields` (no `__v` selected) | Already list-only fields |
| **GET /api/users/me** (getProfile) | `__v` stripped from user object | Same shape |
| **GET /api/admin/tasks** | `postedBy` / `acceptedBy` populated with `name` only (was `name email phone`) | List view; full user in GET /api/admin/tasks/:taskId |
| **GET /api/admin/tasks/:taskId** | `__v` stripped from task and nested `postedBy` / `acceptedBy` | Same shape |

**List vs detail:**

- **List endpoints** return only list-specific fields (e.g. `_id`, `title`, `category`, `budget`, `status`, `location`, `createdAt` for tasks; no full nested user objects).
- **Detail endpoints** return full objects where needed (e.g. task by id with populated poster/worker); internal fields such as `__v` are stripped.
- **Admin list** task rows no longer include poster/worker `email` or `phone`; use admin task detail or user detail for contact info.

## 3. Response Shape Consistency

- No breaking changes: field names and structure are unchanged.
- Only removals: `__v` and (on admin task list) `email`/`phone` on populated users.
- Clients that only use `name` (and `_id`) for poster/worker in admin task list are unaffected. Clients that displayed email/phone in that list must use detail endpoints instead.

## 4. Before vs After Example

**GET /api/tasks/:taskId** (detail):

- **Before:** Task object included `__v`; nested `postedBy` and `acceptedBy` included `__v`.
- **After:** Same structure; `__v` removed from root task and from both nested refs. Slightly smaller JSON; no client contract change.

**GET /api/admin/tasks** (list, one task with poster and acceptor):

- **Before (per task):** `postedBy: { _id, name, email, phone }`, `acceptedBy: { _id, name, email, phone }`.
- **After (per task):** `postedBy: { _id, name }`, `acceptedBy: { _id, name }`. Fewer bytes per row; contact info from GET /api/admin/tasks/:taskId or user detail.

**Compression:**

- Example: a 20 KB JSON response typically compresses to ~2–4 KB with gzip at level 6, reducing bandwidth and often improving time-to-first-byte on slow links.

## 5. Verification

- **No breaking changes:** Response shapes are unchanged except for removed internal/redundant fields.
- **Compression:** Use `Accept-Encoding: gzip` and confirm `Content-Encoding: gzip` on JSON responses; compare body size with and without compression.
- **Payload size:** Compare response sizes for list/detail before and after (e.g. GET /api/admin/tasks and GET /api/tasks/:taskId) to confirm reduction.
