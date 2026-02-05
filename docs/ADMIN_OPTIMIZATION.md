# Admin dashboard and analytics optimization

Reduces MongoDB Atlas Flex ops/sec for admin read-heavy and aggregation-heavy endpoints.

## Summary

- **Pagination:** All list responses include `pages` (in addition to `hasMore`) so the frontend can show Previous/Next correctly. Admin Chats and Admin Tickets now use pagination (page/limit) and show Prev/Next when `pages > 1`.
- **Dashboard (GET /api/admin/dashboard):** One Task `$facet` aggregation for status counts, category, location, GMV, earnings buckets, and counts (total, tasksToday, tasksThisWeek, completedToday, cancelledToday, posters, workers). One User `$facet` for user-role/status/createdAt counts. Fewer round-trips; cached 60s.
- **Dashboard charts (GET /api/admin/dashboard/charts):** Unchanged pipeline shape; already use early `$match` on indexed fields (status, completedAt, createdAt). Cached 60s per period.
- **Pilot dashboard (GET /api/admin/pilot-dashboard):** One Task `$facet` for WAU-related ids, tasks posted, completed/cancelled counts, accept-time average, repeat-user count, doer stats for alerts, categories. Weekly growth: 4 weeks in parallel via `Promise.all` (4 countDocuments each). No full-doc `$push`; repeat users and doer concentration computed in aggregation. Cached 60s per week.
- **Analytics (GET /api/admin/analytics):** One Task `$facet` for topPosters, topWorkers, bestAreas, funnel. Tight `$lookup` projection (name, email only). Cached 60s; invalidated with other admin dashboards.
- **Workers (GET /api/admin/workers):** Single Task aggregation: `$match` acceptedBy not null, `$group` by acceptedBy (tasksAccepted, tasksCompleted, totalEarnings, sumRating, countRated), `$lookup` users with projection, then map to response. Replaces N+1 (per-worker Task.countDocuments + Task.find).
- **Users list (GET /api/admin/users):** One Task `$facet` (posted, accepted, completed, cancelledPoster, cancelledWorker) for the current page’s user ids; merge into user list. Replaces N+1 (four Task.countDocuments per user).

## Aggregations optimized or merged

| Endpoint | Before | After |
|----------|--------|--------|
| getDashboard | Many separate countDocuments + multiple aggregations | 1 Task $facet, 1 User $facet, 2 Report countDocuments, Config find, recent lists |
| getDashboardCharts | 5 separate aggregations | Unchanged (already indexed); cached |
| getPilotDashboard | distinct + find + countDocuments + 4-week loop + Task.find for period | 1 Task $facet (+ User find for created ids), 4× Promise.all countDocuments for weekly growth |
| getAnalytics | 4 separate aggregations | 1 Task $facet |
| getWorkers | distinct + User.find + Promise.all(workerIds.map(3 queries each)) | 1 Task aggregation with $group + $lookup |
| getUsers | User.find page + Promise.all(users.map(4 Task.countDocuments)) | User.find page + 1 Task $facet for stats of page user ids |

## Index usage

- Task: `status`, `createdAt`, `completedAt`, `acceptedBy`, `postedBy`, `location.city` (and 2dsphere on location for geo).
- User: `role`, `status`, `createdAt`.
- Time-range filters use these indexed date/status fields.

## Confirmation

- Admin dashboard load: fewer DB ops per request (one Task facet, one User facet, two Report counts, one Config, two finds for recent).
- Next/Previous: Backend sends `pagination.pages`; admin Users, Tasks, Reports, Logs, Reviews already use it. Chats and Tickets now request with page/limit and show Prev/Next when `pages > 1`.
