const { z } = require('zod');
require('dotenv').config();

const envSchema = z.object({
  NODE_ENV:            z.enum(['development','production','test']).default('development'),
  PORT:                z.string().default('3000'),
  DB_PATH:             z.string().default('./crm.sqlite3'),
  JWT_SECRET:          z.string().min(32),
  JWT_REFRESH_SECRET:  z.string().min(32),
  ENCRYPTION_KEY:      z.string().length(64),
  CORS_ORIGINS:        z.string().default('http://localhost:3000'),
  SENTRY_DSN:          z.string().optional().default(''),
  LOG_LEVEL:           z.string().default('info'),
});

const result = envSchema.safeParse(process.env);
if (!result.success) {
  console.error('❌  Invalid environment variables:');
  console.error(JSON.stringify(result.error.format(), null, 2));
  process.exit(1);
}

module.exports = result.data;
