const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path    = require('path');

const logsDir = path.join(process.cwd(), 'logs');

const fmt = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fmt,
  defaultMeta: { service: 'crm-saas' },
  transports: [
    new DailyRotateFile({
      filename:    path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level:       'error',
      maxFiles:    '30d',
    }),
    new DailyRotateFile({
      filename:    path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles:    '30d',
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

logger.stream = {
  write: (message) => logger.http(message.trim()),
};

module.exports = logger;
