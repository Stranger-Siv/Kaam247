# College / campus pilot – feature list

Features that make sense for a college-focused task app (e.g. Parul University pilot). **Done** = already in the app; **To do** = suggested next.

---

## 1. Location & arrival (like “Reached location”)

| Item | Status | Notes |
|------|--------|------|
| **Worker must confirm “Reached location” before Start task** | **Done** | Worker taps “Reached location”; app checks they’re at the task (200 m). Only then “Start task” and other options show. |
| Restrict task visibility to campus / radius | **Done** | Tasks: `isOnCampus`, radius filters (e.g. 2 km campus, 5 km general). Workers see tasks by location + radius. |
| Worker search radius (how far to see tasks) | **Done** | User preference for default radius; Tasks page uses it. |
| **Worker can only accept if within X km of task** | **Done** | Backend: when accepting, check worker’s location vs task; reject if too far (e.g. 5 km). Reduces no-shows. |
| **Auto-remind worker to go to location after accept** | To do | After accept, optional reminder: “Head to the task location and tap ‘Reached location’ when you’re there.” (notification or in-app). |
| **No-show handling** | **Done** | If worker doesn’t start within X hours of accepted time, poster can “Worker didn’t show” → task reopens, optional penalty/rating. |

---

## 2. Identity & trust (college-specific)

| Item | Status | Notes |
|------|--------|------|
| Phone / Google sign-in | **Done** | Auth in place. |
| **College email verification (.edu or allowed domains)** | To do | Optional: restrict signup or show “Verified student” if email ends with allowed domain (e.g. `@paruluniversity.ac.in`). |
| **Student / enrollment verification** | To do | Optional: upload student ID or link to college portal; admin or automated check; “Verified student” badge on profile. |
| **Profile completeness** | **Done** | Profile setup; can add “Add photo” / “Add phone” nudges for trust. |
| **Ratings & reviews** | **Done** | Poster rates worker after completion; average rating on profile. |
| **Report user / report task** | **Done** | Report flow; admin can resolve. |

---

## 3. Safety & moderation

| Item | Status | Notes |
|------|--------|------|
| In-app chat (no phone until needed) | **Done** | Chat for accepted task; keeps contact in-app. |
| Report user / task | **Done** | Report modal; admin reviews. |
| Admin: block / ban / hide task | **Done** | Admin actions in place. |
| **Share live location (optional)** | To do | Optional “Share my location” with poster when going to task (safety). |
| **Emergency / SOS (optional)** | To do | Optional button to share location + task details with a contact or campus security. |

---

## 4. Scheduling & availability

| Item | Status | Notes |
|------|--------|------|
| Task scheduled time | **Done** | `scheduledAt` on task. |
| Recurring tasks | **Done** | Recurring schedule; pause/resume. |
| **Worker “available hours”** | To do | Worker sets “Available 5–9 PM on weekdays”; don’t show them tasks outside that window (or show but mark “Outside your hours”). |
| **Default “available after class”** | To do | Simple presets: “After 5 PM”, “Weekends only”, “Anytime”. |
| **Task expiry / validity** | **Done** | Valid for X days; extend validity. |

---

## 5. Discovery & UX (campus)

| Item | Status | Notes |
|------|--------|------|
| Categories (college-relevant) | **Done** | Config-driven categories; student templates (e.g. notes, design, errands). |
| “On campus” badge on tasks | **Done** | `isOnCampus`; shown on cards and detail. |
| Map / “Near me” for tasks | **Done** | Task list with distance; map on TaskDetail. |
| **Filter: “Campus only”** | To do | Toggle on Tasks: “Show only on-campus tasks”. |
| **Campus landmarks in address** | To do | Picker or autocomplete: “Hostel B”, “Library”, “Block 3” so addresses are recognisable. |
| Notifications for new tasks in radius | **Done** | Push / socket for new tasks when worker is online. |

---

## 6. Payments & completion

| Item | Status | Notes |
|------|--------|------|
| Budget on task; payment outside app | **Done** | Budget is informational; payment is offline. |
| **Payment only after “Confirm completion”** | **Done** | Poster confirms after worker marks complete. |
| **Receipt / summary for reimbursement** | To do | Optional PDF or screen: task title, amount, date, parties (for college reimbursement). |

---

## 7. Accountability & reliability

| Item | Status | Notes |
|------|--------|------|
| **Reached location before Start** | **Done** | Worker must be at location (200 m) to unlock Start task. |
| **Start task only when at location** | **Done** | Same flow. |
| **Cancel limit / abuse** | **Done** | Cancellation count; admin can reset. |
| **Auto-reopen if worker doesn’t start** | To do | E.g. “If not started in 2 hours, task reopens”; optional reminder to worker. |
| **“Worker didn’t show” flow** | To do | Poster marks no-show → task reopens; optional impact on worker rating/cancel count. |

---

## 8. Admin & pilot ops

| Item | Status | Notes |
|------|--------|------|
| Admin dashboard, users, tasks, reports | **Done** | Admin panel. |
| Pilot dashboard (WAU, funnel, etc.) | **Done** | PilotDashboard. |
| Onboarding & profile feedback | **Done** | Feedback endpoints; college pilot feedback. |
| **Campus-level analytics** | To do | Optional: filter stats by campus/city or “on-campus” tasks only. |
| **Semester / session reset (optional)** | To do | Optional: archive old tasks, “New semester” message, remind users to update availability. |

---

## 9. Technical / reliability (college pilot)

| Item | Status | Notes |
|------|--------|------|
| **Online status persists on refresh** | **Done** | Availability state initialised from localStorage; no “goes offline on refresh”. |
| PWA / Add to Home Screen | **Done** | PWA support. |
| Push notifications | **Done** | For new tasks, etc. |
| **Offline / poor network** | To do | Show “You’re offline” or queue actions when network fails. |

---

## Quick summary

- **Already in place (college-relevant):** Reached location + Start task gating, on-campus tasks & radius, ratings, reports, chat, cancellation limits, pilot dashboard, feedback, online state on refresh.
- **High-value next steps for college:**  
  - Restrict accept to within X km.  
  - “Worker didn’t show” / no-show handling.  
  - Optional college email or student verification.  
  - “Campus only” filter and worker available hours.  
  - Optional share location / SOS for safety.

Use this list to pick the next items to implement for the college pilot.
