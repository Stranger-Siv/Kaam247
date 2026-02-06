# Authentication Flow: Show Everything, Login When Needed

Users can **browse the full app** (dashboard, tasks, post-task flow, profile, etc.) without logging in. Login is asked **only at the point of use**: a clear "Login" button or prompt on each page, and on the **last step of post-task** (submit) the user is sent to login and returned to complete the action.

## Public Access (No Login Required)

- **/** – Home / landing
- **/login**, **/register** – Auth pages
- **/terms**, **/privacy** – Platform info
- **App routes** – **/dashboard**, **/tasks**, **/tasks/:id**, **/post-task**, **/profile**, **/activity**, **/earnings**, **/transactions**, **/support**, **/settings** are all **reachable without login**. Each page shows content and a "Login to …" CTA where needed.

## Guest Experience

### Dashboard

- Guests see the dashboard page with a short description and **"Login to see your dashboard and get started"** + Login button.

### Worker: Tasks & Task Detail

- **/tasks** – Task list is visible to everyone. A banner at the top: **"Login to view tasks near you and accept work"** with Login button. After login, user returns to `/tasks`.
- **/tasks/:id** – Task detail is visible. Banner: **"Login to see full details and accept this task"** with Login button. After login, user returns to that task page.

### Poster: Post Task

- **/post-task** – All steps (title, description, category, location, **budget**) are visible to everyone.
- On the **last step (budget / submit)**:
  - A **"Login to post this task and track its progress"** CTA is shown.
  - If the user clicks **"Post Task Nearby"** without being logged in, they are redirected to **/login?returnUrl=/post-task&message=poster** and, after login, returned to **/post-task** to submit.

### Other Pages (Profile, Activity, Earnings, Transactions, Support, Settings)

- Each page is visible. When the user is not logged in, the page shows a short title/description and **"Login to see your profile"** (or activity, earnings, transactions, support ticket, settings) with a Login button. No data is loaded until they log in.

## Layout for Guests

- **MainLayout** and **BottomNav** work for both guests and logged-in users.
- **Guests** see: Dashboard, Tasks, Post a Task, Activity, Profile in the nav, and a **Login** link instead of Logout.
- **Logged-in** users see mode-specific nav (worker: Tasks, Earnings; poster: Post Task, Transactions) plus Logout.

## Redirect-After-Login

- When a guest clicks **Login** from a page, they go to **/login** with **returnUrl** (and optional **message** for worker/poster intent).
- **After successful login** (form or Google): redirect to **returnUrl** if valid, else `/dashboard` (or `/admin` for admins).
- **After setup-profile** (Google first-time): if **returnUrl** was passed in `location.state`, redirect there after profile completion.

## Key Files

- **`client/src/components/layout/AppLayout.jsx`** – Wraps app routes; no redirect to login (only setup-profile and admin redirects when authenticated).
- **`client/src/components/LoginCTA.jsx`** – Reusable "Login to …" prompt with returnUrl.
- **`client/src/utils/authIntents.js`** – `returnUrl`/message helpers, `isSafeReturnUrl`.
- **`client/src/pages/public/Login.jsx`** – Reads returnUrl/message, shows intent message, redirects after login.
- **`client/src/pages/SetupProfile.jsx`** – Uses `location.state.returnUrl` after profile setup when present.
- **Per-page guest handling** – Dashboard, Tasks, TaskDetail, PostTask, Profile, Activity, Earnings, Transactions, Support, Settings each check `!user?.id` and render a LoginCTA (or, for PostTask, redirect to login on submit).

Existing auth/session/token logic (AuthContext, tokens, profile setup) is unchanged.
