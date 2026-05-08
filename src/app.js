require('dotenv').config();
const express   = require('express');
const helmet    = require('helmet');
const cors      = require('cors');
const morgan    = require('morgan');
const path      = require('path');
const env       = require('./config/env');
const logger    = require('./utils/logger');
const { i18next, middleware: i18nMiddleware } = require('./config/i18n');
const requestId = require('./middleware/requestId');
const { globalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

// Route modules
const authRoutes         = require('./modules/auth/auth.routes');
const employeeRoutes     = require('./modules/employees/employees.routes');
const attendanceRoutes   = require('./modules/attendance/attendance.routes');
const leaveRoutes        = require('./modules/leave/leave.routes');
const payrollRoutes      = require('./modules/payroll/payroll.routes');
const payslipRoutes      = require('./modules/payslips/payslips.routes');
const performanceRoutes  = require('./modules/performance/performance.routes');
const kpiRoutes          = require('./modules/kpis/kpis.routes');
const analyticsRoutes    = require('./modules/analytics/analytics.routes');
const departmentRoutes   = require('./modules/departments/departments.routes');
const positionRoutes     = require('./modules/positions/positions.routes');
const announcementRoutes = require('./modules/announcements/announcements.routes');
const notificationRoutes = require('./modules/notifications/notifications.routes');
const auditRoutes        = require('./modules/audit/audit.routes');
const settingsRoutes     = require('./modules/settings/settings.routes');
const usersRoutes        = require('./modules/users/users.routes');
const tenantsRoutes      = require('./modules/tenants/tenants.routes');

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = env.CORS_ORIGINS.split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS not allowed'));
  },
  credentials: true,
}));

// ── Request ID ────────────────────────────────────────────────────────────────
app.use(requestId);

// ── HTTP Logging ──────────────────────────────────────────────────────────────
app.use(morgan('combined', { stream: logger.stream }));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── i18n ──────────────────────────────────────────────────────────────────────
app.use(i18nMiddleware.handle(i18next));

// ── Global rate limiter ───────────────────────────────────────────────────────
app.use(globalLimiter);

// ── Static uploads ────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() }));

// ── API Routes ────────────────────────────────────────────────────────────────
const v1 = '/api/v1';
app.use(`${v1}/auth`,          authRoutes);
app.use(`${v1}/employees`,     employeeRoutes);
app.use(`${v1}/attendance`,    attendanceRoutes);
app.use(`${v1}/leave`,         leaveRoutes);
app.use(`${v1}/payroll`,       payrollRoutes);
app.use(`${v1}/payslips`,      payslipRoutes);
app.use(`${v1}/performance`,   performanceRoutes);
app.use(`${v1}/kpis`,          kpiRoutes);
app.use(`${v1}/analytics`,     analyticsRoutes);
app.use(`${v1}/departments`,   departmentRoutes);
app.use(`${v1}/positions`,     positionRoutes);
app.use(`${v1}/announcements`, announcementRoutes);
app.use(`${v1}/notifications`, notificationRoutes);
app.use(`${v1}/audit`,         auditRoutes);
app.use(`${v1}/settings`,      settingsRoutes);
app.use(`${v1}/users`,         usersRoutes);
app.use(`${v1}/tenants`,       tenantsRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Route not found' }));

// ── Centralised error handler ─────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
