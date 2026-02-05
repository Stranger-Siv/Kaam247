# Kaam247 – Manual Testing Guide

Step-by-step checks for **backend APIs** and **frontend UI**. Use this to verify each area after changes.

**Prerequisites**
- Backend: `cd server && npm run dev` (or `npm start`) – e.g. http://localhost:3001  
- Frontend: `cd client && npm run dev` – e.g. http://localhost:5173  
- For API tests: Postman, Insomnia, or `curl`. Use `API_BASE_URL` (e.g. http://localhost:3001).  
- For auth APIs: store the returned `token` and send `Authorization: Bearer <token>` on protected requests.

---

# Part A – Backend (API) Testing

## A1. Health & smoke

| Step | Action | Expected |
|------|--------|----------|
| 1 | `GET {API_BASE_URL}/health` | 200, body: `{ "status": "OK", "message": "Kaam247 backend running" }` |
| 2 | `GET {API_BASE_URL}/api/test` | 200, body: `{ "message": "Task routes are working!" }` |
| 3 | `GET {API_BASE_URL}/api/admin/users` (no token) | 401 Unauthorized |
| 4 | `GET {API_BASE_URL}/api/users/me` (no token) | 401 Unauthorized |

---

## A2. Auth APIs

| Step | Action | Expected |
|------|--------|----------|
| 1 | `POST /api/auth/register` with body: `{ "name": "Test User", "email": "test@example.com", "phone": "9876543210", "password": "password123" }` | 201, body has `token` and `user` (no password). Save token. |
| 2 | Same request again (duplicate email) | 400, message about email/phone already exists |
| 3 | `POST /api/auth/login` with `{ "identifier": "test@example.com", "password": "password123" }` | 200, `token` and `user` in body |
| 4 | Login with wrong password | 400/401, error message |
| 5 | `POST /api/auth/logout` (optional: with cookie/token) | 200 success |
| 6 | `PATCH /api/auth/profile-setup` with `Authorization: Bearer <token>` and body e.g. `{ "name": "Test", "phone": "9876543210" }` | 200 and updated user (if backend expects this shape) |

**Google login:** Use the frontend (Google button); backend `POST /api/auth/google` with `{ "idToken": "..." }` from Google sign-in.

---

## A3. Public & config APIs (no auth)

| Step | Action | Expected |
|------|--------|----------|
| 1 | `GET /api/categories` | 200, `{ "categories": [...] }` |
| 2 | `GET /api/platform-config` | 200, `{ "platformCommissionPercent": number }` |
| 3 | `GET /api/stats` | 200, `totalUsers`, `totalCompletedTasks`, `categoryCount`, `averageRating` |
| 4 | Call 1–3 again | Same data (cached); no errors |

---

## A4. Task APIs (use token for protected actions)

| Step | Action | Expected |
|------|--------|----------|
| 1 | `GET /api/tasks` (no params) | 200, `tasks` array, `pagination`: `page`, `limit`, `total`, `hasMore`, `pages` |
| 2 | `GET /api/tasks?page=1&limit=5` | 200, up to 5 tasks, `pagination.hasMore` true if total > 5 |
| 3 | `GET /api/tasks?page=2&limit=5` | 200, next 5 tasks (no overlap with page 1) |
| 4 | `GET /api/tasks?lat=23.0&lng=72.5&radius=5` | 200, tasks with `distanceKm`; only within radius |
| 5 | `GET /api/tasks?lat=23.0&lng=72.5&radius=20` | 400, message like "radius must not exceed 15 km" |
| 6 | `POST /api/tasks` with `Authorization: Bearer <token>` and body: title, description, category, budget, location, postedBy (user id) | 201, created task |
| 7 | `GET /api/tasks/:taskId` | 200, single task; if geo: `?lat=&lng=` can add `distanceKm` |
| 8 | `PUT /api/tasks/:taskId/edit` with token and updated fields | 200, updated task |
| 9 | `POST /api/tasks/:taskId/accept` (worker token) | 200, task status ACCEPTED |
| 10 | `POST /api/tasks/:taskId/start` | 200, status IN_PROGRESS |
| 11 | `POST /api/tasks/:taskId/mark-complete` | 200, worker marked complete |
| 12 | `POST /api/tasks/:taskId/confirm-complete` (poster token) | 200, status COMPLETED |
| 13 | `POST /api/tasks/:taskId/rate` with `{ "rating": 5, "review": "Great" }` | 200 |
| 14 | `DELETE /api/tasks/:taskId` or cancel endpoint (as allowed) | 200 / 204 as per API |

---

## A5. User APIs (all with `Authorization: Bearer <token>`)

| Step | Action | Expected |
|------|--------|----------|
| 1 | `GET /api/users/me` | 200, user object (no password, no `__v`) |
| 2 | `PUT /api/users/me` with body e.g. name, roleMode | 200, updated user |
| 3 | `GET /api/users/me/activity` | 200, `activity`: posted, accepted, completed, cancelled; `pagination` |
| 4 | `GET /api/users/me/activity?page=2&limit=10` | 200, next page; `pagination.hasMorePosted` / `hasMoreAccepted` as applicable |
| 5 | `GET /api/users/me/earnings` | 200, earnings summary + `tasks` array, `pagination` |
| 6 | `GET /api/users/me/earnings?page=2&limit=20` | 200, next page of tasks in earnings |
| 7 | `GET /api/users/me/transactions` | 200, transactions summary + tasks, `pagination` |
| 8 | `GET /api/users/me/transactions?page=2&limit=20` | 200, next page |
| 9 | `GET /api/users/me/tickets` | 200, `tickets` array, `pagination` |
| 10 | `GET /api/users/me/tickets?page=2&limit=20` | 200, next page of tickets |
| 11 | `POST /api/users/me/tickets` with `{ "type": "SUPPORT", "subject": "Help", "message": "Need help" }` | 201, created ticket |
| 12 | `GET /api/users/me/tickets/:ticketId` | 200, single ticket with messages |
| 13 | `POST /api/users/me/tickets/:ticketId/messages` with `{ "text": "Hello" }` | 201 |

---

## A6. Task chat

| Step | Action | Expected |
|------|--------|----------|
| 1 | `GET /api/tasks/:taskId/chat` with token | 200, `messages` array (and optional `isReadOnly`) |
| 2 | `POST /api/tasks/:taskId/chat` with `{ "text": "Hi" }` | 201, message in response |
| 3 | Send many messages in quick succession | After limit: 429; body message about rate limit |

---

## A7. Reports (auth required)

| Step | Action | Expected |
|------|--------|----------|
| 1 | `POST /api/reports` with token and body (reporter, reportedUser/reportedTask, reason, etc.) | 201 or per API spec |
| 2 | Without token | 401 |

---

## A8. Admin APIs (admin user token only)

Use a user with `role: 'admin'`. All under `/api/admin/`.

| Step | Action | Expected |
|------|--------|----------|
| 1 | `GET /api/admin/users` | 200, `users` array, `pagination` |
| 2 | `GET /api/admin/users?page=2&limit=20` | 200, second page; `pagination.hasMore` correct |
| 3 | `GET /api/admin/users?search=test` | 200, filtered list |
| 4 | `GET /api/admin/users/:userId` | 200, single user detail |
| 5 | `GET /api/admin/tasks` | 200, `tasks`, `pagination` |
| 6 | `GET /api/admin/tasks?page=2` | 200, next page |
| 7 | `GET /api/admin/tasks/:taskId` | 200, task + timeline |
| 8 | `GET /api/admin/reports` | 200, `reports`, `pagination` |
| 9 | `GET /api/admin/reports?page=2` | 200, next page |
| 10 | `GET /api/admin/tickets` | 200, `tickets`, `pagination` |
| 11 | `GET /api/admin/tickets?page=2` | 200, next page |
| 12 | `GET /api/admin/chats` | 200, `chats`, `pagination` |
| 13 | `GET /api/admin/chats?userId=<id>` | 200, chats for that participant only |
| 14 | `GET /api/admin/reviews` | 200, `reviews`, `pagination` |
| 15 | `GET /api/admin/logs` | 200, `logs`, `pagination` |
| 16 | `GET /api/admin/dashboard` | 200, dashboard payload |
| 17 | `GET /api/admin/dashboard/charts?period=weekly` | 200, charts data |
| 18 | `GET /api/admin/analytics` | 200, topPosters, topWorkers, bestAreas, funnel |
| 19 | `GET /api/admin/stats` | 200, admin stats |
| 20 | `GET /api/admin/settings` | 200, settings map |
| 21 | `PATCH /api/admin/tickets/:ticketId/accept` | 200 |
| 22 | `POST /api/admin/tickets/:ticketId/messages` with `{ "text": "..." }` | 201 |
| 23 | `PATCH /api/admin/tickets/:ticketId/resolve` | 200 |
| 24 | `PATCH /api/admin/reports/:id/resolve` with body | 200 |
| 25 | Non-admin token on any `/api/admin/*` | 403 |

---

# Part B – Frontend (Browser) Testing

Use the app in the browser (e.g. http://localhost:5173). Prefer a clean profile or incognito for auth tests.

---

## B1. App load & layout

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `/` | Home (landing) loads; no blank screen; no console errors |
| 2 | Open `/login`, `/register` | Public layout: header with logo, theme toggle; form visible |
| 3 | Log in (or register) | Redirect to dashboard (or /admin if admin); main layout: header, nav, content |
| 4 | Check desktop nav | Dashboard, Tasks/Post, Activity, Earnings/Transactions, Profile, Logout visible as per role/mode |
| 5 | Check mobile (narrow viewport) | Bottom nav visible; header compact; no horizontal scroll |
| 6 | Refresh on `/dashboard`, `/tasks`, `/profile` | Same page loads; no flash of wrong content |
| 7 | Browser Back after navigating | Previous page; state consistent |
| 8 | Log out | Redirect to `/`; header shows public layout; no protected content |

---

## B2. Auth flows

| Step | Action | Expected |
|------|--------|----------|
| 1 | Go to `/register`. Submit with invalid data (short password, bad email) | Validation messages; no redirect |
| 2 | Register with valid name, email, phone, password | Success; redirect to dashboard (or setup-profile if needed) |
| 3 | Log out. Go to `/login`. Wrong password | Error message; stay on login |
| 4 | Login with correct credentials | Redirect to dashboard (or admin to /admin) |
| 5 | While logged out, open `/dashboard` or `/tasks` | Redirect to `/` (or login) |
| 6 | After Google login (if used), if profile incomplete | Redirect to /setup-profile; after completing, redirect to dashboard |
| 7 | Logout | Redirect to home; token/user cleared |

---

## B3. Home & landing

| Step | Action | Expected |
|------|--------|----------|
| 1 | On `/`, scroll hero and sections | Hero, “What is Kaam247”, “How it works”, “Why Kaam247”, “Safety”, “Kaam247 in numbers” (stats) visible |
| 2 | Click “Post a Task” (logged out) | Navigate to /login |
| 3 | Click “Post a Task” (logged in) | Navigate to /post-task |
| 4 | Click “Find Work Nearby” / “Browse Tasks” | Same as above (login or /tasks) |
| 5 | Resize to mobile | Layout stacks; CTAs and text readable; no overflow |
| 6 | Check “Kaam247 in numbers” | Numbers or “—” while loading; no errors |

---

## B4. Task list (worker: /tasks)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Log in as worker; go to /tasks. Allow location if prompted | Task list or “Location required” / “Go online” message |
| 2 | If location allowed and online | List of task cards (or empty state); loading skeletons then content |
| 3 | Change category filter | List updates; only first page (or reset to page 1) |
| 4 | Change distance (e.g. Within 2 km) | List updates; distances shown |
| 5 | Change sort (Nearest, Budget, Newest) | Order changes |
| 6 | If there are enough tasks, click “Load more tasks” | More tasks append; button shows “Loading...” then “Load more” or disappears if no more |
| 7 | Toggle “Show bookmarked only” | List filters to saved tasks only |
| 8 | Click a task card | Navigate to /tasks/:id |
| 9 | On task detail, click back/nav to Tasks | “Tasks” nav item active only on /tasks, not on /tasks/:id |
| 10 | Worker off duty | Message “You are OFF DUTY”; no task list |

---

## B5. Task detail & actions

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open a task (OPEN/SEARCHING) as worker | Accept button visible; task details, map if applicable |
| 2 | Click Accept | Button loading then success; task status updates; poster phone visible when allowed |
| 3 | As poster, open your accepted task | Start (or similar) for worker; you see worker contact when allowed |
| 4 | As worker: Start task | Status IN_PROGRESS; “Mark complete” (or similar) appears |
| 5 | As worker: Mark complete | Status waits for poster confirmation |
| 6 | As poster: Confirm complete | Status COMPLETED; rating option for poster |
| 7 | Submit rating (e.g. 5 + review) | Success; rating shown |
| 8 | Open chat (accepted/in-progress task) | Messages load; can send; scroll to bottom on new message |
| 9 | Send many messages very fast | After limit: “Sending too fast. Please wait a moment.” (429) |
| 10 | Cancel task (where allowed) | Confirmation; task removed or status cancelled |
| 11 | Edit task (poster, allowed status) | Edit form/modal; save updates task |
| 12 | Delete task (poster) | Confirmation; task deleted; redirect or list update |

---

## B6. Create & edit task (poster)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Go to /post-task. Submit with missing required fields | Validation messages |
| 2 | Fill title, description, category, budget, location (and any required) | Validation passes |
| 3 | Submit | Success; redirect or list update; new task visible |
| 4 | Open your task; edit (e.g. title, budget) | Pre-filled form; save updates task |
| 5 | Duplicate task | New task created; redirect or list update |
| 6 | Try double submit (click twice fast) | Only one request (button disabled while loading) |

---

## B7. User dashboard, profile, activity

| Step | Action | Expected |
|------|--------|----------|
| 1 | Go to /dashboard | Dashboard content; no errors |
| 2 | Go to /profile | Profile view; edit if available |
| 3 | Update profile and save | Success message; data updated |
| 4 | Go to /activity | Tabs: Posted / Accepted / Completed / Cancelled (by mode) |
| 5 | If many items, click “Load more” on Activity | More items append; no duplicates |
| 6 | Switch tabs | Correct list per tab; counts in tab labels |
| 7 | Click a task in Activity | Navigate to /tasks/:id |

---

## B8. Earnings & transactions

| Step | Action | Expected |
|------|--------|----------|
| 1 | As worker: go to /earnings | Summary (total, today, week, month); task list or calendar |
| 2 | If “Load more” shown, click it | More tasks append |
| 3 | As poster: go to /transactions | Summary; list of spent tasks |
| 4 | If “Load more” shown, click it | More tasks append |
| 5 | Resize to mobile | Layout readable; no overflow |

---

## B9. Support tickets

| Step | Action | Expected |
|------|--------|----------|
| 1 | Go to /support | “Create support ticket” and “My support tickets” |
| 2 | Click “Create support ticket”; submit with empty subject/message | Validation |
| 3 | Fill subject and message; submit | Success message; ticket appears in list |
| 4 | If many tickets, click “Load more” | More tickets append |
| 5 | Click a ticket | Navigate to /support/:ticketId; messages visible |
| 6 | Send a message (if status allows) | Message appears in thread |
| 7 | Check status badge (OPEN, ACCEPTED, RESOLVED) | Correct style and text |

---

## B10. Admin panel

Use an admin user. All under `/admin` or `/admin/...`.

| Step | Action | Expected |
|------|--------|----------|
| 1 | Go to /admin | Overview/dashboard; admin layout and sidebar |
| 2 | Open Users list | Table/cards; pagination if more than one page |
| 3 | Go to page 2 (Users) | Different rows; “Previous”/“Next” correct; no missing users |
| 4 | Use search/filters (Users) | List filters; pagination resets or updates |
| 5 | Open a user detail | Full user info; actions (block, etc.) if present |
| 6 | Open Tasks, Reports, Tickets, Chats, Reviews, Logs | Each list loads; pagination works (page 2, hasMore) |
| 7 | Open a task/ticket/report detail | Detail view; actions (resolve, accept, etc.) work |
| 8 | Dashboard / Charts / Analytics | Data loads; no console errors; charts render |
| 9 | Non-admin user tries /admin | Redirect to /dashboard (or 403) |

---

## B11. Responsiveness & accessibility

| Step | Action | Expected |
|------|--------|----------|
| 1 | Resize to ~375px width | No horizontal scroll; tap targets comfortable |
| 2 | Resize to ~768px | Layout adapts (e.g. table vs cards on admin) |
| 3 | Resize to desktop | Full nav; readable columns |
| 4 | Tab through forms (keyboard) | Focus visible; logical order |
| 5 | Toggle theme (dark/light) | Colors update; text readable |

---

# Quick checklist (minimal pass)

- [ ] Backend: GET /health and GET /api/test return 200.
- [ ] Backend: Register → login → GET /api/users/me with token returns 200 and user.
- [ ] Backend: GET /api/tasks?page=1&limit=5 returns tasks and pagination.
- [ ] Backend: GET /api/admin/users with admin token returns 200; without token 401.
- [ ] Frontend: Open app → login → dashboard loads; logout → home.
- [ ] Frontend: Tasks list → filters → Load more (if available).
- [ ] Frontend: Task detail → Accept (or equivalent) → status updates.
- [ ] Frontend: Activity / Earnings / Support each have Load more where applicable.
- [ ] Frontend: Admin users list → page 2 → no missing rows.

Use this guide to run a full manual pass or to smoke-test a single area after changes.
