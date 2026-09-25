# Attendance analytics

FastAPI service for student reports using the application's PostgreSQL `Student`, `SchoolSettings`, `GateLog`, and `RoomLog` tables. The frontend requests reports through Express, which checks the staff session and student access before contacting this service.

## Run with Docker

From `backend`, after applying the database migrations:

```sh
docker compose up --build -d analytics
```

Alternatively, `npm run docker:up` starts the API, analytics, and PostgreSQL together. The host API uses `http://127.0.0.1:8000`; the containerized API uses `http://analytics:8000`.

## Run with Python

Use Python 3.10 or newer. From `analytics`:

```sh
python -m venv .venv
```

Activate with `.venv\Scripts\Activate.ps1` in PowerShell or `source .venv/bin/activate` on macOS/Linux, then:

```sh
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

The service reads `backend/.env`, without overriding existing environment variables. `DATABASE_URL` must point to the same database as Express. Prisma's `?schema=public` parameter is removed before connecting through psycopg2; other schemas are not supported. Compose supplies its own database URL.

Set the same `ANALYTICS_SERVICE_TOKEN` in both services, or leave it unset to use `JWT_SECRET`. Every report request to FastAPI requires this token in `X-Analytics-Token`; it stays on the server. Configure Express's `ANALYTICS_URL` if the service runs at a different address.

## Reports

Open `/en/reports` or `/th/reports` in the web application. Select a student, a date range, and gate/classroom/combined attendance. Generate the report and use **Print** for a clean printable version.

The public API routes live on Express:

| Route | Result |
| --- | --- |
| `GET /analytics/students` | Students available to the signed-in staff member. |
| `GET /analytics/reports/student/:id` | Metadata, summary, and attendance records. |
| `GET /analytics/reports/student/:id/history` | Attendance records only. |
| `GET /analytics/reports/student/:id/analysis` | Metadata and summary only. |
| `GET /analytics/reports/student/:id/csv` | Downloadable CSV. |

Use the student's internal UUID for `:id`. Report queries accept `start` and `end` as inclusive `YYYY-MM-DD` dates, and `kind=all`, `gate`, or `room`. The default range is the current month to today in the school timezone. A range can contain at most 366 days; dates are filtered in SQL before records are loaded.

Administrators can select all students. Teachers can select students whose current class section matches a class in their assigned timetable. A permitted student's report covers their attendance records in the requested range. Other accounts cannot access reports.

### Interpretation

- Gate rows represent attendance days, not individual swipes. First arrival determines lateness using the **current** school timezone and cutoff; a later re-entry does not turn an on-time first arrival into a late arrival.
- Gate history shows first arrival and latest recorded exit. It cannot reconstruct intermediate taps.
- Room rows preserve their recorded `PRESENT`/`LATE` status. Repeated scans do not count as extra sessions.
- Empty date ranges return a successful report with zero counts. A nonexistent or unauthorized student returns `404`.
- Missing records are not counted as absences. Historical timetable snapshots and school calendars are not available, so an absence percentage would be misleading.
- The legacy `seeder.py` is incompatible with these tables and truncates data. Do not run it against the application database.

## Testing

Rule tests run without a live database:

```sh
python -m unittest -v test_reports.ReportRulesTest
```

For database and API integration tests, use a **separate disposable database whose name ends in `_test`**. Apply the backend's Prisma migrations to it first, then:

1. Set `ANALYTICS_TEST_DATABASE_URL` to the test database connection string. From `analytics`, run `python -m unittest -v test_reports`. Database fixtures are rolled back after each test.
2. Start a separate analytics instance connected to that database with `ANALYTICS_SERVICE_TOKEN=report-test-internal-only`, for example on port `58039`.
3. In a separate backend terminal, set `ANALYTICS_TEST_DATABASE_URL` to the same database and `ANALYTICS_URL=http://127.0.0.1:58039`. Run `npm run build` and `npm run test:reports`. The API tests create and remove only their own fixtures.

The tests cover first-arrival lateness after re-entry, cutoff equality, inclusive dates, report-type filters, empty reports, UTC serialization, CSV formula escaping, teacher scope, anonymous access, invalid requests, and an unavailable analytics service.
