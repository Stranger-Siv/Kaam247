# List endpoint pagination

All list-based API endpoints use the same pagination parameters and response shape so reads stay bounded and memory/ops stay predictable on Atlas Flex and Render 512 MB.

---

## Parameters

| Query param | Default | Max | Description |
|-------------|--------|-----|-------------|
| `page`      | 1      | —   | 1-based page index |
| `limit`     | 20     | 50  | Page size (clamped to 50) |

Helper: `server/utils/pagination.js` — `parsePagination(req.query)` returns `{ page, limit, skip }`; `paginationMeta(page, limit, total, itemsLength)` returns `{ page, limit, total, hasMore }`.

---

## Endpoints paginated

| Method | Endpoint | Notes |
|--------|----------|--------|
| GET | `/api/tasks` | DB read capped at 500; in-memory filter/sort then slice by page/limit |
| GET | `/api/tasks/user/:userId` | skip/limit at DB |
| GET | `/api/tasks/user/:userId/analytics` | Read capped at 1000 tasks (no page/limit in response) |
| GET | `/api/users/me/activity` | skip/limit on posted and accepted; CSV export uses `export=csv` and cap 2000 |
| GET | `/api/users/me/earnings` | Task list paginated; summary via aggregation |
| GET | `/api/users/me/transactions` | Task list paginated; summary via aggregation |
| GET | `/api/users/me/tickets` | skip/limit at DB |
| GET | `/api/admin/users` | skip/limit at DB |
| GET | `/api/admin/tasks` | skip/limit at DB |
| GET | `/api/admin/reports` | skip/limit at DB |
| GET | `/api/admin/tickets` | skip/limit at DB |
| GET | `/api/admin/logs` | skip/limit at DB |
| GET | `/api/admin/reviews` | skip/limit at DB |

---

## Example response (with pagination metadata)

```json
{
  "message": "Tasks fetched successfully",
  "tasks": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "title": "Pick up package",
      "description": "...",
      "category": "Errands",
      "budget": 150,
      "status": "OPEN",
      "location": { "coordinates": [77.59, 12.97], "area": "Koramangala", "city": "Bangalore" },
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "hasMore": true
  }
}
```

---

## CSV export (activity)

- **Opt-out:** `GET /api/users/me/activity?export=csv` returns a single CSV file (no pagination).
- **Guard:** When `export=csv`, each of the two Task queries is limited to 2000 rows (`CSV_EXPORT_MAX_ROWS`) so the export is bounded.

---

## How this reduces DB ops and memory

- **Bounded reads:** Every list uses either `skip` + `limit` (and a max limit of 50) or a fixed cap (e.g. 500 for available tasks, 1000 for analytics, 2000 for CSV). No endpoint can return an unbounded number of documents.
- **Lower memory:** Smaller pages mean less data in a single response and less work in one request; 512 MB stays enough under concurrent load.
- **Atlas Flex:** Capping limit and total read size keeps ops/sec and data transfer predictable and avoids spikes from large list requests.
