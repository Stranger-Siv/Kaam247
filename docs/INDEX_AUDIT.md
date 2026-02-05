# MongoDB Index Audit

Audit based on actual query usage in controllers; tuned for Atlas Flex and low-memory (e.g. Render 512 MB). No text or wildcard indexes; no indexes on high-churn fields beyond what queries need.

---

## Task model

### Indexes kept (now defined in schema)

| Index | Justification |
|-------|----------------|
| `location.coordinates` (2dsphere) | Already on subdocument. Kept for future $geoNear/$geoWithin if getAvailableTasks is refactored to use DB-side geo. |
| `status: 1` | getAvailableTasks, admin getTasks, dashboard/pilot aggregates, countDocuments by status. |
| `postedBy: 1` | getTasksByUser, getPosterTaskAnalytics, getActivity, admin getUserById. |
| `acceptedBy: 1` | getEarnings, getActivity, getWorkers (distinct + per-worker finds), admin getUserById. |
| `category: 1` | getAvailableTasks filter, admin getTasks filter, dashboard by category. |
| `createdAt: -1` | Sort in getAvailableTasks (no location), getTasksByUser, getActivity, admin task list, dashboard/pilot time ranges. |
| `postedBy: 1, status: 1` | Filter “my tasks by status” and countDocuments(postedBy + status). |
| `acceptedBy: 1, status: 1` | getEarnings, getWorkers completed-tasks lookup. |
| `category: 1, status: 1` | Admin task filter by category + status. |
| `status: 1, createdAt: -1` | Admin task list sort; dashboard time-based matches. |

### Indexes added

| Index | Justification |
|-------|----------------|
| `completedAt: 1` | Dashboard/pilot aggregates and countDocuments by completedAt range; set once per task (low write cost). |
| `acceptedAt: 1` | Pilot dashboard and time-to-accept analytics; set once per task (low write cost). |
| `status: 1, isHidden: 1, isRecurringTemplate: 1, createdAt: -1` | getAvailableTasks: exact filter fields + sort; avoids full collection scan. |
| `postedBy: 1, createdAt: -1` | getTasksByUser and getActivity sort/filter by postedBy + date. |
| `acceptedBy: 1, createdAt: -1` | getActivity filter/sort by acceptedBy + date. |

### Indexes removed

| Index | Justification |
|-------|----------------|
| `scheduledAt: 1` | No find/count/aggregate in code uses scheduledAt; removes write amplification. |
| `status: 1, location.coordinates: 2dsphere` | getAvailableTasks does not use geo in the query (distance in app); compound was unused and costly. |
| Standalone `createdAt: -1` | Kept (used by many queries and as sort). |

---

## User model

### Indexes kept (from schema or added in schema)

| Index | Justification |
|-------|----------------|
| `email` (unique, sparse) | From schema. Auth findOne by email. |
| `phone` (unique, sparse) | From schema. Auth and profile lookup/duplicate check. |
| `googleId` (unique, sparse) | From schema. Google login findOne. |
| `location.coordinates` (2dsphere) | From schema. Kept for future geo; not used in current API queries. |
| `role: 1` | Admin count/list by role; getDashboard recent users. |
| `status: 1` | Admin count/list by status; getPublicStats-style filters. |
| `createdAt: -1` | Admin user list sort; pilot/dashboard user growth. |
| `status: 1, role: 1` | Admin countDocuments({ status, role }). |
| `role: 1, createdAt: -1` | Admin User.find({ role: 'user' }).sort(createdAt: -1).limit(20). |

### Indexes added

| Index | Justification |
|-------|----------------|
| `lastOnlineAt: -1` | Replaces incorrect lastSeen (field does not exist). Supports “recently active” if used later; low churn. |

### Indexes removed

| Index | Justification |
|-------|----------------|
| `lastSeen: -1` | User schema has lastOnlineAt, not lastSeen; index was on wrong field. |
| `status: 1, location.coordinates: 2dsphere` | No User query uses geo in DB; reduces memory and write cost. |

---

## Report model

### Indexes added

| Index | Justification |
|-------|----------------|
| `status: 1` | Admin report list filter by status. |
| `createdAt: -1` | Admin report list sort. |

---

## Other models

- **AdminLog**: Existing schema indexes kept (adminId+createdAt, resource+resourceId, createdAt). Used by getLogs.
- **Config**: Unique on `key` from schema; no change.
- **Chat**: taskId unique from schema; admin list is small and sorted by createdAt (optional index not added to keep writes low).
- **UserFeedback, SupportTicket**: No new indexes; volume is low.

---

## Summary list

### Kept

- **Task:** status, postedBy, acceptedBy, category, createdAt, location 2dsphere, postedBy+status, acceptedBy+status, category+status, status+createdAt.
- **User:** email, phone, googleId (from schema), location 2dsphere, role, status, createdAt, status+role, role+createdAt (latter two added in schema).
- **AdminLog:** adminId+createdAt, resource+resourceId, createdAt.

### Removed

- **Task:** scheduledAt; status+location 2dsphere.
- **User:** lastSeen (wrong field); status+location 2dsphere.
- **indexes.js:** Manual per-index createIndex arrays (replaced by schema-driven createIndexes).

### Added

- **Task:** completedAt, acceptedAt; compound (status, isHidden, isRecurringTemplate, createdAt); postedBy+createdAt; acceptedBy+createdAt.
- **User:** lastOnlineAt; status+role; role+createdAt (compounds in schema).
- **Report:** status; createdAt.

---

## Effects

- **Memory:** Fewer and more targeted compounds; no unused status+geo compounds.
- **Writes:** No indexes on high-churn fields beyond what queries need; scheduledAt and unused geo compound dropped.
- **Flex/CPU:** Better use of index for getAvailableTasks and time-based dashboard/pilot queries; single source of truth in schemas and createIndexes.
