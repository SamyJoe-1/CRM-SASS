const app    = require('./app');
const env    = require('./config/env');
const db     = require('./config/database');
const logger = require('./utils/logger');
const fs     = require('fs');
const path   = require('path');

// Ensure required directories exist
['uploads','uploads/exports','uploads/payslips','logs'].forEach(d => {
  const full = path.join(process.cwd(), d);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
});

// Optional Sentry
if (env.SENTRY_DSN) {
  const Sentry = require('@sentry/node');
  Sentry.init({ dsn: env.SENTRY_DSN });
}

const PORT = parseInt(env.PORT, 10);

const start = async () => {
  try {
    // Verify DB connection
    await db.raw('SELECT 1');
    logger.info('Database connection established');

    app.listen(PORT, () => {
      logger.info(`🚀  CRM SaaS running on port ${PORT} [${env.NODE_ENV}]`);
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err.message, stack: err.stack });
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

start();
