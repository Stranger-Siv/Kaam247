# Backend Scan Summary

Scan covers: all API routes, controllers, MongoDB models, and identification of heavy endpoints, aggregations, and geo-related logic. **No behavior was changed.**

---

## 1. API Routes and Controllers

| Route file        | Mount path   | Controller(s) |
|-------------------|-------------|----------------|
| `authRoutes.js`  | `/api`      | `authController`: register, login, logout, googleLogin, completeProfileSetup |
| `taskRoutes.js`  | `/api`      | `taskController`: createTask, getAvailableTasks, getTaskById, acceptTask, cancelTask, startTask, markComplete, confirmComplete, rateTask, editTask, deleteTask, duplicateTask, bulkCancelTasks, bulkExtendValidity, bulkDeleteTasks, getTasksByUser, getPosterTaskAnalytics, setRecurringSchedule; `chatController`: getMessages, sendMessage; `adminController`: getPublicStats |
| `userRoutes.js`  | `/api`      | `userController`: createUser, getProfile, updateProfile, getActivity, getEarnings, getTransactions, getCancellationStatus, getActiveTask, submitOnboardingFeedback, submitProfileFeedback, savePushSubscription, saveTaskTemplate, getTaskTemplates, deleteTaskTemplate, toggleSavedTask, getAvailabilitySchedule, updateAvailabilitySchedule; `supportTicketController`: createTicket, getMyTickets, getMyTicketById, sendUserTicketMessage |
| `reportRoutes.js` | `/api`      | `reportController`: createReport |
| `geocodeRoutes.js`| `/api`      | Inline: GET `/geocode/reverse` (reverse geocode via Nominatim) |
| `configRoutes.js`| `/api`      | Inline: GET `/categories`, GET `/platform-config` |
| `adminRoutes.js` | `/api/admin`| `adminController`: getUsers, getUserById, updateUser, blockUser, unblockUser, banUser, resetCancellations, updateCancelLimit, getTasks, getTaskById, cancelTask, unassignTask, hideTask, getReports, resolveReport, getStats, getDashboard, getDashboardCharts, getPilotDashboard, setPilotStartDate, getWorkers, getChats, getChatByTaskId, getSettings, updateSettings, getReviews, getFeedback, getLogs, getAnalytics; `supportTicketController`: getTickets, getAdminTicketById, acceptTicket, sendAdminTicketMessage, resolveTicket |

---

## 2. MongoDB Models and Schemas

| Model          | File           | Purpose |
|----------------|----------------|---------|
| **User**       | `User.js`      | Users: name, email, phone, password, googleId, location (GeoJSON Point, 2dsphere), role, roleMode, status, cancellationCountToday, cancellationLimit, lastSeen, onboardingFeedback, etc. |
| **Task**       | `Task.js`      | Tasks: title, description, category, budget, status, postedBy, acceptedBy, location (GeoJSON Point, 2dsphere), scheduledAt, startedAt, completedAt, acceptedAt, rating, viewCount, isRecurringTemplate, recurringSchedule, etc. |
| **Chat**       | `Chat.js`      | One doc per task: taskId (unique), participants[], messages[] (senderId, text, createdAt). |
| **Config**     | `Config.js`    | Key-value: key (unique), value (Mixed), description, updatedAt, updatedBy. Used for taskCategories, platformCommissionPercent, pilotStartDate. |
| **Report**     | `Report.js`    | Reports: reporter, reportedUser, reportedTask, reason, description, status (open/resolved), adminNotes, resolvedAt. |
| **AdminLog**   | `AdminLog.js`  | Admin actions: adminId, action, resource, resourceId, details, ip, userAgent, createdAt. Indexes: adminId+createdAt, resource+resourceId. |
| **UserFeedback** | `UserFeedback.js` | Profile/rating feedback: user, rating, text, createdAt. |
| **SupportTicket** | `SupportTicket.js` | Tickets: user, type (MOBILE_UPDATE/SUPPORT), subject, initialMessage, requestedPhone, status, messages[] (senderId, text, createdAt). |

**Indexes** (`indexes.js`): Task — status, location.coordinates (2dsphere), postedBy, acceptedBy, category, scheduledAt, createdAt; compound (status+location, postedBy+status, acceptedBy+status, category+status, status+createdAt). User — email, phone, status, role, location.coordinates (2dsphere), lastSeen; compound (status+role, status+location).

---

## 3. Routes That Return Large Lists (no or high limit)

| Endpoint | Controller | Behavior |
|----------|------------|----------|
| **GET /api/tasks** | `getAvailableTasks` | `Task.find(query).lean()` with **no limit**. Returns all OPEN/SEARCHING (non-hidden, non-expired) tasks; then filters/sorts in memory by distance (Haversine in app). **Heavy when task count grows.** |
| **GET /api/tasks/user/:userId** | `getTasksByUser` | `Task.find(filter).lean()` with **no limit**. Returns all tasks posted by user. |
| **GET /api/tasks/user/:userId/analytics** | `getPosterTaskAnalytics` | `Task.find({ postedBy: userId }).lean()` with **no limit**; then aggregates in memory. |
| **GET /api/users/me/activity** | `getActivity` | Two `Task.find()` (posted + accepted by user) with **no limit**; supports CSV export. |
| **GET /api/users/me/earnings** | `getEarnings` | `Task.find({ acceptedBy, status: 'COMPLETED' }).lean()` with **no limit**; then periods/categories in memory. |
| **GET /api/admin/users** | `getUsers` | Paginated (default limit 20) but **N+1**: for each user runs 4× `Task.countDocuments()`. |
| **GET /api/admin/workers** | `getWorkers` | `Task.distinct('acceptedBy')` then `User.find({ _id: { $in: workerIds } })`; then for each worker `Task.find({ acceptedBy, status: 'COMPLETED' })` for stats — **N+1**. |
| **GET /api/admin/feedback** | `getFeedback` | `UserFeedback.find()` and `User.find(...onboardingFeedback...)` with **no limit**. |

---

## 4. Routes That Use Aggregation

| Endpoint | Controller | Aggregation usage |
|----------|------------|--------------------|
| **GET /api/admin/dashboard** | `getDashboard` | Task: status counts, by category (count+revenue), by location.city, GMV/completed today/week/month, posters/workers distinct counts; Task.find recent 30 + User.find recent 20. |
| **GET /api/admin/dashboard/charts** | `getDashboardCharts` | Task: revenue time-series, tasks created/completed/cancelled per bucket; User: growth time-series. Multiple `Task.aggregate` and `User.aggregate`. |
| **GET /api/admin/pilot-dashboard** | `getPilotDashboard` | Task: WAU, tasks in period, completion rate, avg time to accept, repeat users, weekly growth, categories (top 5), funnel; User: new users, created in period. Mix of find/countDocuments and `Task.aggregate`. |
| **GET /api/admin/analytics** | `getAnalytics` | Task.aggregate: topPosters (completed, group by postedBy), topWorkers (completed, group by acceptedBy), bestAreas (group by location.city), funnel (group by status). |
| **GET /api/users/me/earnings** | `getEarnings` | Uses find + in-memory reduce; no aggregation in getEarnings itself. |
| (userController helper) | — | One `Task.aggregate` in userController (e.g. badge/analytics helper around line 642) for **avg accept time** (worker). |

---

## 5. Geo-Related Logic (no $geoNear in API)

- **Models:** `Task` and `User` have `location.coordinates` [lng, lat] with **2dsphere** index (see `Task.js`, `User.js`, `indexes.js`).
- **API usage:** No route uses MongoDB `$geoNear` or `$geoWithin`. **GET /api/tasks** (`getAvailableTasks`): builds a status/expiry query, runs `Task.find(query).lean()`, then in **application code** computes distance (Haversine via `utils/distance.js`) for each task, filters by radius, and sorts. So geo is “filter in app” not “query by geo” in DB.
- **Socket / push:** `socketHandler.js` uses task and worker coordinates for distance checks when notifying workers of new tasks; still application-level distance, not geo queries.

---

## 6. Summary: Heavy Endpoints

| Endpoint | Why heavy |
|----------|-----------|
| **GET /api/tasks** | Loads all open tasks, no limit; distance filter/sort in memory. |
| **GET /api/tasks/user/:userId** | All tasks for user, no limit. |
| **GET /api/tasks/user/:userId/analytics** | All tasks for user, no limit; analytics in memory. |
| **GET /api/users/me/activity** | All posted + accepted tasks for user, no limit. |
| **GET /api/users/me/earnings** | All completed tasks for user (worker), no limit. |
| **GET /api/admin/dashboard** | Many countDocuments + several Task/User aggregates + recent Task (30) + User (20). |
| **GET /api/admin/dashboard/charts** | Multiple Task and User aggregates over 30d/84d/1y. |
| **GET /api/admin/pilot-dashboard** | Multiple finds/counts + Task aggregates + weekly loops. |
| **GET /api/admin/users** | Paginated list but 4× Task.countDocuments per user (N+1). |
| **GET /api/admin/workers** | Distinct + User find + per-worker Task find for stats (N+1). |
| **GET /api/admin/feedback** | UserFeedback.find() and User.find() with no limit. |

---

## 7. Models Most Involved in Hot Paths

- **Task** — Used by getAvailableTasks (full open-task scan), getTasksByUser, getPosterTaskAnalytics, getActivity, getEarnings, admin dashboard/charts/pilot/analytics, getWorkers (distinct + per-worker completed), admin getTasks/list.
- **User** — getUsers (list + N+1 Task counts), getUserById (plus multiple Task finds), getWorkers (list + N+1), getDashboard (recent users), getDashboardCharts (user growth), getFeedback, auth (findBy email/googleId/phone).
- **Config** — platform-config, categories, pilot start date, settings; low volume.
- **Chat** — getChats, getChatByTaskId; bounded by task count.
- **Report** — getReports (paginated), createReport.
- **AdminLog** — getLogs (paginated).
- **UserFeedback** — getFeedback (no limit).
- **SupportTicket** — ticket list/detail and messages; moderate.

---

## 8. Potential DB Hot Paths (high read load or scalability risk)

1. **GET /api/tasks** — Full collection scan on Task for OPEN/SEARCHING (no limit, no geo index used). Primary candidate for adding limit and/or `$geoNear` (or `$geoWithin`) to use 2dsphere index.
2. **GET /api/admin/dashboard** — Many aggregations and counts per request; likely called on every admin overview load.
3. **GET /api/admin/dashboard/charts** — Multiple aggregations over large time windows.
4. **GET /api/admin/pilot-dashboard** — Multiple finds/counts and aggregates; week selector can increase work.
5. **GET /api/admin/users** — N+1: 4 Task.countDocuments per user in page.
6. **GET /api/admin/workers** — N+1: one Task.find per worker for completed stats.
7. **GET /api/users/me/activity** — Two unbounded Task finds (posted + accepted) per user.
8. **GET /api/users/me/earnings** — One unbounded Task find (all completed for user).
9. **GET /api/tasks/user/:userId** and **GET /api/tasks/user/:userId/analytics** — Unbounded Task finds for one poster.

No behavior was changed; this document only reports findings.
