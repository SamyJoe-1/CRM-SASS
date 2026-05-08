# CRM SaaS Backend

Production-ready multi-tenant SaaS CRM backend built with Node.js, Express, SQLite (via Knex), and JWT auth.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| npm | 9+ |

---

## Installation

```bash
git clone <repo>
cd crm-saas
npm install

# Copy env and fill in values
cp .env.example .env

# Run migrations
npm run migrate

# Seed demo data
npm run seed

# Start dev server
npm run dev
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | No | `development` / `production` / `test` |
| `PORT` | No | HTTP port (default `3000`) |
| `DB_PATH` | No | SQLite file path (default `./crm.sqlite3`) |
| `JWT_SECRET` | **Yes** | Min 32 chars – signs access tokens (15 min) |
| `JWT_REFRESH_SECRET` | **Yes** | Min 32 chars – signs refresh tokens (7 days) |
| `ENCRYPTION_KEY` | **Yes** | 64 hex chars (32 bytes) – AES-256 for attendance policy IPs/SSIDs |
| `CORS_ORIGINS` | No | Comma-separated allowed origins |
| `SENTRY_DSN` | No | Sentry error-tracking DSN (optional) |
| `LOG_LEVEL` | No | Winston log level (default `info`) |

---

## Knex Commands

```bash
npm run migrate            # Apply all pending migrations
npm run migrate:rollback   # Rollback last batch
npm run seed               # Run all seed files
```

---

## Demo Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@platform.com | Admin@123 |
| HR Manager | hr@demo.com | Hr@123456 |
| Finance | finance@demo.com | Finance@123 |
| Employee | ahmed@demo.com | Employee@123 |

---

## API Endpoints

### Auth  `/api/v1/auth`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/login` | Login – returns access + refresh tokens |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | Revoke refresh token |
| POST | `/forgot-password` | Request password reset token |
| POST | `/reset-password` | Reset password with token |
| GET | `/me` | Get current user |
| PUT | `/me` | Update current user profile |
| PUT | `/me/password` | Change password |

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hr@demo.com","password":"Hr@123456"}'

# Get me (replace TOKEN)
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer TOKEN"
```

### Employees  `/api/v1/employees`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | employees:view | List employees (filterable) |
| POST | `/` | employees:create | Create employee |
| GET | `/export?format=xlsx` | employees:export | Export (xlsx/csv/pdf) |
| GET | `/:id` | employees:view | Get employee |
| PUT | `/:id` | employees:update | Update employee |
| DELETE | `/:id` | employees:delete | Soft delete |
| POST | `/:id/terminate` | employees:terminate | Terminate employee |
| POST | `/:id/documents` | employees:update | Upload document |
| GET | `/:id/documents` | employees:view | List documents |
| DELETE | `/:id/documents/:docId` | employees:update | Delete document |

```bash
curl http://localhost:3000/api/v1/employees?page=1&per_page=10&search=ahmed \
  -H "Authorization: Bearer TOKEN"
```

### Attendance  `/api/v1/attendance`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/policy` | Get attendance policy |
| PUT | `/policy` | Update policy (IPs/SSIDs encrypted) |
| POST | `/clock-in` | Clock in |
| POST | `/clock-out` | Clock out |
| GET | `/records` | List records |
| PUT | `/records/:id` | Manual edit (HR) |
| GET | `/summary/:employeeId?year=&month=` | Monthly summary |
| GET | `/export` | Export records |

### Leave  `/api/v1/leave`
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/types` | Leave types CRUD |
| PUT/DELETE | `/types/:id` | Update/delete type |
| GET | `/requests` | List requests |
| POST | `/requests` | Submit request |
| POST | `/requests/:id/approve` | Approve |
| POST | `/requests/:id/reject` | Reject |
| POST | `/requests/:id/cancel` | Cancel |
| GET | `/balances/:employeeId` | Get balances |
| GET | `/calendar` | Calendar view |

### Payroll  `/api/v1/payroll`
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/` | List/create cycles |
| GET/DELETE | `/:id` | Get/delete cycle |
| POST | `/:id/generate` | Auto-generate records for all active employees |
| GET | `/:id/records` | List records |
| PUT | `/:id/records/:recordId` | Edit record (bonus/deductions) |
| POST | `/:id/records/:recordId/process` | Process single record |
| POST | `/:id/process-all` | Process all → auto-generate payslips |
| POST | `/:id/records/:recordId/cancel` | Cancel single |
| POST | `/:id/cancel-all` | Cancel cycle |
| GET | `/:id/summary` | Totals |
| GET | `/:id/export` | Export |

### Payslips  `/api/v1/payslips`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | All payslips (HR/Finance) |
| GET | `/mine` | Own payslips (employee) |
| GET | `/:id` | Get single |
| GET | `/:id/download` | Download PDF (generated on first fetch) |
| POST | `/:id/viewed` | Mark as viewed |

### Performance  `/api/v1/performance`
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/` | List/create reviews |
| GET | `/stats` | Aggregate stats |
| GET/PUT/DELETE | `/:id` | Get/update/delete (draft only) |
| POST | `/:id/submit` | Submit → notifies employee |
| POST | `/:id/acknowledge` | Employee acknowledges |

### KPIs  `/api/v1/kpis`
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/` | List/create |
| GET | `/dashboard` | Dashboard cards |
| GET/PUT/DELETE | `/:id` | CRUD |
| POST | `/:id/progress` | Update progress value |

### Analytics  `/api/v1/analytics`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/overview` | Dashboard stats |
| GET | `/attendance-trends` | Attendance by date |
| GET | `/payroll-trends` | Monthly payroll totals |
| GET | `/leave-usage` | Leave by type |
| GET | `/performance` | Avg performance scores |
| GET | `/kpi-achievement` | KPI achievement rate |
| GET | `/headcount` | Headcount over time |
| POST | `/export` | Export any report `{report_type, filters, format}` |

### Departments  `/api/v1/departments`
CRUD: GET `/`, POST `/`, GET `/:id`, PUT `/:id`, DELETE `/:id`

### Positions  `/api/v1/positions`
CRUD: GET `/`, POST `/`, GET `/:id`, PUT `/:id`, DELETE `/:id`

### Announcements  `/api/v1/announcements`
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/` | List/create |
| GET/PUT | `/:id` | Get/update |
| POST | `/:id/publish` | Publish → broadcasts notification to all users |
| DELETE | `/:id` | Delete |

### Notifications  `/api/v1/notifications`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List notifications |
| GET | `/unread-count` | Unread count |
| POST | `/:id/read` | Mark as read |
| POST | `/read-all` | Mark all as read |

### Audit Logs  `/api/v1/audit`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List logs (filterable) |
| GET | `/export` | Export |

### Settings  `/api/v1/settings`
| Method | Path | Description |
|--------|------|-------------|
| GET/PUT | `/general` | Tenant general settings |
| GET/PUT | `/payroll` | Payroll config |
| GET | `/roles` | List roles |
| GET | `/users` | List users |

### Users  `/api/v1/users`
CRUD + activate/deactivate/reset-password

### Tenants  `/api/v1/tenants` _(super_admin only)_
CRUD + activate/deactivate

---

## Role & Permission Model

Four system roles built in:

| Role | Key Permissions |
|------|----------------|
| `super_admin` | Bypasses all permission checks |
| `hr_manager` | Full access to all HR modules |
| `finance` | Payroll, payslips, analytics |
| `employee` | Own attendance, leave, payslips, KPI progress |

**Resolution order per request:**
1. User-level DENY override → `403 Forbidden`
2. User-level GRANT override → allowed
3. Role default via `role_permissions` table → allowed/denied
4. No match → `403 Forbidden`

---

## Filtering, Sorting & Pagination

All list endpoints support:

| Param | Example | Description |
|-------|---------|-------------|
| `search` | `?search=ahmed` | Full-text search |
| `status` | `?status=active` | Filter by status |
| `department_id` | `?department_id=uuid` | Filter by department |
| `date_from` | `?date_from=2024-01-01` | Range start |
| `date_to` | `?date_to=2024-12-31` | Range end |
| `min_base_salary` | `?min_base_salary=5000` | Numeric min |
| `max_base_salary` | `?max_base_salary=15000` | Numeric max |
| `sort_by` | `?sort_by=hire_date` | Sort column |
| `sort_dir` | `?sort_dir=asc` | `asc` or `desc` |
| `page` | `?page=2` | Page number |
| `per_page` | `?per_page=50` | Results per page (max 100) |

**Standard paginated response:**
```json
{
  "success": true,
  "data": [...],
  "meta": { "page": 1, "per_page": 20, "total": 150, "total_pages": 8 }
}
```

---

## Architecture

```
src/
├── config/         env validation, DB, i18n setup
├── db/
│   ├── migrations/ 26 migration files (001–026)
│   └── seeds/      5 seed files with full demo data
├── middleware/     authenticate, authorize, tenantScope,
│                   validate, rateLimiter, upload,
│                   auditLogger, errorHandler, requestId
├── modules/        One folder per domain:
│                   auth, employees, attendance, leave,
│                   payroll, payslips, performance, kpis,
│                   analytics, departments, positions,
│                   announcements, notifications, audit,
│                   settings, users, tenants
├── utils/          AppError hierarchy, asyncHandler,
│                   response, pagination, filterBuilder,
│                   exportHelper, networkHelper,
│                   payrollEngine, logger
├── locales/en/ ar/ i18n translation keys
├── app.js          Express app setup
└── server.js       HTTP server + startup
```

---

## Security Notes

- All passwords hashed with bcrypt (saltRounds=12)
- JWT access tokens expire in 15 minutes; refresh tokens in 7 days
- Attendance policy IP ranges and SSIDs stored AES-256 encrypted; **never returned in any API response**
- All queries use Knex parameterized bindings — no raw string concatenation
- Rate limiting: auth routes 10/15min, global 300/min
- Helmet sets secure HTTP headers
- CORS restricted to `CORS_ORIGINS` env value

---

## Running Tests

```bash
npm test
```

Unit tests cover: payroll engine, pagination utilities, filter builder.
Integration tests cover: auth login/refresh/me endpoints.
