# Read query optimizations

Applied across task, user, and admin controllers for lower memory use and better ops/sec on Render 512 MB and MongoDB Atlas Flex. No behavior changes; only how data is read and projected.

---

## 1. GET /api/tasks (getAvailableTasks) – geo and projection

**Geo (when `lat`/`lng`/`radius` provided)**

- **Before:** `Task.find(query).limit(500)` then in-app Haversine for every doc, filter by radius, sort by distance → high CPU and many docs read.
- **After:** Single aggregation with `$geoNear` (first stage). MongoDB uses the **2dsphere index on `Task.location`** to filter by `maxDistance` and return `distanceKm`; no in-app distance math. `lat`/`lng`/`radius` validated; radius capped at 15 km.
- **Impact:** One indexed geo op instead of read-then-filter; fewer DB docs and much less CPU per request.

**Projection (unchanged)**

- Only list-needed fields via `listFields` / `$project`; `location` and `distanceKm` included where relevant.

---

## 2. GET /api/users/me/activity (getActivity)

**Before**
```js
const postedTasks = await Task.find({ postedBy: userId, ...createdAtQuery })
  .populate('acceptedBy', 'name')
  .sort({ createdAt: -1 })
  .lean()
const acceptedTasks = await Task.find({ acceptedBy: userId, ...createdAtQuery })
  .populate('postedBy', 'name')
  .sort({ createdAt: -1 })
  .lean()
```
- Full task documents; only a subset of fields used in the response.

**After**
```js
const activityFields = '_id title category budget status workerCompleted createdAt completedAt rating'
const postedTasks = await Task.find({ postedBy: userId, ...createdAtQuery })
  .select(activityFields)
  .populate('acceptedBy', 'name')
  .sort({ createdAt: -1 })
  .lean()
// same for acceptedTasks with .select(activityFields).populate('postedBy', 'name')
```
- Only fields needed for the activity UI (no description, location, postedBy/acceptedBy refs beyond populate).
- **Impact:** Smaller Task reads and less work turning docs into the final activity payload; populate still limited to `name`.

---

## 3. GET /api/admin/users (getUsers)

**Before**
```js
const users = await User.find(query)
  .select('-password')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limitNum)
// ...
return { ...user.toObject(), stats: { ... } }
```
- Full user docs (except password); Mongoose documents kept in memory until `toObject()`.

**After**
```js
const userListFields = '_id name email phone role status createdAt averageRating'
const users = await User.find(query)
  .select(userListFields)
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limitNum)
  .lean()
// ...
return { ...user, stats: { ... } }
```
- Only list-needed user fields; plain objects via `.lean()` (no Mongoose doc overhead).
- **Impact:** Lower memory per user row and no change tracking; list pages stay within 512 MB more easily under load.

---

## Short list of queries optimized

| Endpoint / helper | Change |
|-------------------|--------|
| **GET /api/tasks** | `.select(listFields)` + existing `.lean()`. |
| **GET /api/tasks/:taskId** | `.lean()`, response from plain object; populate kept for phone visibility. |
| **GET /api/tasks/user/:userId** | `.select(listFields)` + existing `.lean()`. |
| **GET /api/tasks/user/:userId/analytics** | `.select('status viewCount acceptedAt createdAt').lean()`. |
| **GET /api/users/me/activity** | `.select(activityFields)` on both Task finds; populate unchanged. |
| **GET /api/users/me/earnings** | `.select(earningsFields)` + populate `postedBy` name only. |
| **GET /api/users/me/transactions** | `.select(txFields)` + populate `acceptedBy` name only. |
| **getWorkerBadges** | Task find for earnings: `.select('budget').lean()`. |
| **GET /api/admin/users** | `.select(userListFields).lean()`; return `...user` instead of `user.toObject()`. |
| **GET /api/admin/users/:userId** | User: `.lean()`; all Task finds: `.lean()` added. |
| **GET /api/admin/tasks** | `.select(taskListFields).populate(…).lean()`. |
| **GET /api/admin/tasks/:taskId** | `.lean()`, timeline Task.findOne: `.select('createdAt').lean()`. |
| **GET /api/admin/reports** | `.select(...)` + `.lean()`. |
| **GET /api/admin/dashboard** | recentTasks: `.select(recentTaskFields)`; recentUsers: `.select(recentUserFields)`. |
| **GET /api/admin/workers** | User: `.select(workerListFields)`; per-worker Task find: `.select('budget rating').lean()`. |
| **GET /api/admin/reviews** | `.select(reviewFields)` + existing populate and `.lean()`. |
| **getPublicStats** | Task find for ratings: `.select('rating').lean()`. |
| **Chat validateChatAccess** | Task: `.select('status postedBy acceptedBy').lean()`. |

---

## Memory and ops/sec impact

- **Memory:** `.lean()` returns plain objects and avoids Mongoose documents and change tracking. `.select()` reduces payload size per document. Together they lower heap use per request, which helps on 512 MB and reduces GC pressure.
- **Ops/sec:** Smaller documents mean less BSON decode and less data copied; Atlas Flex and the app do less work per read. List endpoints (tasks, users, reports, workers) benefit most.
- **No full-doc loads for counts:** Counts use `countDocuments`; only where a list or aggregation is needed do we use `find` with a tight `.select()` and `.lean()`.

All changes are read-only: no write paths or validation logic were modified.
