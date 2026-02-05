# Kaam247 API Reference

Base URL: `http://localhost:3001` (or your deployed backend URL).

All API routes are under `/api` unless noted. Send `Authorization: Bearer <token>` for authenticated routes (login/register return a token; it is also set in a cookie).

---

## Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check. Returns `{ status: 'OK', message: 'Kaam247 backend running' }`. |

---

## Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Register with email/password. Body: `{ email, password, name?, phone? }`. |
| POST | `/api/auth/login` | No | Login with email/password. Body: `{ email, password }`. Returns user + token (and cookie). |
| POST | `/api/auth/logout` | No | Logout; clears auth cookie. |
| POST | `/api/auth/google` | No | Google Sign-In. Body: `{ idToken }`. Returns user + token (and cookie). |
| PATCH | `/api/auth/profile-setup` | Yes | Complete profile after Google sign-in. Body: `{ name, phone }`. |

---

## Config (public)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/categories` | No | Get task categories. Returns `{ categories: string[] }`. |
| GET | `/api/platform-config` | No | Get platform config. Returns `{ platformCommissionPercent: number }`. |

---

## Tasks

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/stats` | No | Public stats (counts for landing page). |
| GET | `/api/tasks` | No | List available tasks (open for workers). Query: `?lat=&lng=&radius=&category=&limit=` etc. |
| GET | `/api/tasks/:taskId` | No | Get single task by ID. |
| GET | `/api/tasks/user/:userId` | No | Tasks posted by a user. |
| GET | `/api/tasks/user/:userId/analytics` | No | Poster task analytics for that user. |
| POST | `/api/tasks` | No | Create task. Body: title, description, category, budget, location, etc. |
| POST | `/api/tasks/:taskId/accept` | No | Worker accepts task. |
| POST | `/api/tasks/:taskId/cancel` | No | Cancel task (poster or worker, depending on rules). |
| POST | `/api/tasks/:taskId/start` | No | Worker starts task (ACCEPTED → IN_PROGRESS). |
| POST | `/api/tasks/:taskId/mark-complete` | No | Worker marks task complete. |
| POST | `/api/tasks/:taskId/confirm-complete` | No | Poster confirms completion. |
| POST | `/api/tasks/:taskId/rate` | No | Poster rates worker after completion. Body: `{ rating: number }`. |
| PUT | `/api/tasks/:taskId/edit` | No | Poster edits their task. |
| PATCH | `/api/tasks/:taskId/recurring` | No | Set recurring schedule or pause. |
| DELETE | `/api/tasks/:taskId` | No | Poster deletes their task. |
| POST | `/api/tasks/:taskId/duplicate` | No | Poster duplicates task. |
| POST | `/api/tasks/bulk-cancel` | No | Bulk cancel tasks. Body: task IDs. |
| POST | `/api/tasks/bulk-extend-validity` | No | Bulk extend task validity. |
| POST | `/api/tasks/bulk-delete` | No | Bulk delete tasks. |

### Task chat

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/tasks/:taskId/chat` | Yes | Get messages for task. |
| POST | `/api/tasks/:taskId/chat` | Yes | Send message. Body: `{ text }`. |

---

## Users (authenticated)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/users` | No | Create user (public signup). |
| GET | `/api/users/me` | Yes | Get current user profile. |
| PUT | `/api/users/me` | Yes | Update profile (name, phone, etc.). |
| GET | `/api/users/me/activity` | Yes | Activity history. Query: `?dateFrom=&dateTo=&export=csv`. |
| GET | `/api/users/me/earnings` | Yes | Worker earnings (totals, by period, by category, task list). |
| GET | `/api/users/me/transactions` | Yes | Poster spend / transactions. |
| GET | `/api/users/me/cancellation-status` | Yes | Worker cancellation status (daily count, limit). |
| GET | `/api/users/me/active-task` | Yes | Check if user has an active task. |
| POST | `/api/users/me/onboarding-feedback` | Yes | Save onboarding feedback. |
| POST | `/api/users/me/feedback` | Yes | Submit profile/suggestion feedback. |
| POST | `/api/users/me/saved-tasks/:taskId` | Yes | Toggle bookmark on a task. |
| GET | `/api/users/me/availability-schedule` | Yes | Get availability schedule. |
| PATCH | `/api/users/me/availability-schedule` | Yes | Update availability schedule. |
| POST | `/api/users/me/push-subscription` | Yes | Save FCM token for push notifications. |
| POST | `/api/users/me/templates` | Yes | Save a task template. |
| GET | `/api/users/me/templates` | Yes | List task templates. |
| DELETE | `/api/users/me/templates/:templateId` | Yes | Delete a task template (templateId = index). |

### Support tickets (user)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/users/me/tickets` | Yes | Create support ticket. |
| GET | `/api/users/me/tickets` | Yes | List current user's tickets. |
| GET | `/api/users/me/tickets/:ticketId` | Yes | Get one ticket with messages. |
| POST | `/api/users/me/tickets/:ticketId/messages` | Yes | Send message (when ticket ACCEPTED). |

---

## Reports

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/reports` | Yes | Create report (e.g. report a task/user). Body: type, targetId, reason, etc. |

---

## Geocode

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/geocode/reverse?lat=&lng=` | No | Reverse geocode. Returns `{ area, city, lat, lng }`. Rate limited. |

---

## Admin (all require auth + admin role)

Base path: `/api/admin`.

### Users

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/users` | List users. Query: filters, search, pagination. |
| GET | `/api/admin/users/:userId` | Get user details. |
| PATCH | `/api/admin/users/:userId` | Update user (name, phone). |
| PATCH | `/api/admin/users/:userId/block` | Block user. |
| PATCH | `/api/admin/users/:userId/unblock` | Unblock user. |
| PATCH | `/api/admin/users/:userId/ban` | Ban user. |
| PATCH | `/api/admin/users/:userId/reset-cancellations` | Reset daily cancellation count. |
| PATCH | `/api/admin/users/:userId/update-cancel-limit` | Update user's cancellation limit. |

### Tasks

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/tasks` | List all tasks (filters). |
| GET | `/api/admin/tasks/:taskId` | Get task details. |
| PATCH | `/api/admin/tasks/:taskId/cancel` | Force cancel task. |
| PATCH | `/api/admin/tasks/:taskId/unassign` | Remove worker from task. |
| PATCH | `/api/admin/tasks/:taskId/hide` | Hide task from public listings. |

### Reports

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/reports` | List all reports. |
| PATCH | `/api/admin/reports/:id/resolve` | Resolve report. |

### Stats & dashboards

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/stats` | Legacy overview stats. |
| GET | `/api/admin/dashboard` | Full dashboard (tasks, revenue, users, activity). |
| GET | `/api/admin/dashboard/charts` | Charts. Query: `?period=daily|weekly|monthly`. |
| GET | `/api/admin/pilot-dashboard` | Pilot success dashboard. Query: `?week=1` (1–4). |
| PUT | `/api/admin/pilot-dashboard/start-date` | Set pilot start date. Body: `{ pilotStartDate: "YYYY-MM-DD" }`. |

### Workers, chats, settings

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/workers` | List workers. |
| GET | `/api/admin/chats` | List chats. |
| GET | `/api/admin/chats/:taskId` | Get chat by task ID. |
| GET | `/api/admin/settings` | Get settings (categories, commission %, etc.). |
| PUT | `/api/admin/settings` | Update settings. |

### Reviews, feedback, logs, analytics

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/reviews` | List reviews. |
| GET | `/api/admin/feedback` | Onboarding + profile feedback. |
| GET | `/api/admin/logs` | Admin action logs. |
| GET | `/api/admin/analytics` | Analytics. |

### Support tickets (admin)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/tickets` | List tickets. |
| GET | `/api/admin/tickets/:ticketId` | Get ticket with messages. |
| PATCH | `/api/admin/tickets/:ticketId/accept` | Accept ticket. |
| POST | `/api/admin/tickets/:ticketId/messages` | Send message. |
| PATCH | `/api/admin/tickets/:ticketId/resolve` | Resolve ticket. |

---

## Test route

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/test` | No | Task router test. Returns `{ message: 'Task routes are working!' }`. |

---

## Authentication

- **Cookie:** After login/register/Google login, the server sets an HTTP-only cookie with the token. Browser requests to the same origin send it automatically.
- **Header:** You can also send `Authorization: Bearer <token>` (e.g. for mobile or Postman). Token is returned in the login/register response body.

Use the token from login/register for all routes marked "Yes" in the Auth column.
