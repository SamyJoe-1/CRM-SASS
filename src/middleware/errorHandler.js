const logger    = require('../utils/logger');
const { AppError } = require('../utils/AppError');

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  logger.error(err.message, {
    stack:      err.stack,
    requestId:  req.requestId,
    tenantId:   req.tenantId,
    path:       req.path,
    method:     req.method,
  });

  if (err.isOperational) {
    const body = {
      success: false,
      code:    err.code,
      message: err.message,
    };
    if (err.errors) body.errors = err.errors;
    return res.status(err.statusCode).json(body);
  }

  // unexpected error – never leak stack to client
  res.status(500).json({
    success: false,
    code:    'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  });
};
