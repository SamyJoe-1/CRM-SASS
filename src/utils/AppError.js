class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code       = code || 'APP_ERROR';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(msg = 'Resource not found') { super(msg, 404, 'NOT_FOUND'); }
}
class UnauthorizedError extends AppError {
  constructor(msg = 'Unauthorized') { super(msg, 401, 'UNAUTHORIZED'); }
}
class ForbiddenError extends AppError {
  constructor(msg = 'Forbidden') { super(msg, 403, 'FORBIDDEN'); }
}
class ValidationError extends AppError {
  constructor(msg = 'Validation failed', errors) {
    super(msg, 422, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}
class ConflictError extends AppError {
  constructor(msg = 'Conflict') { super(msg, 409, 'CONFLICT'); }
}
class BusinessError extends AppError {
  constructor(msg = 'Business rule violation') { super(msg, 400, 'BUSINESS_ERROR'); }
}

module.exports = { AppError, NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError, BusinessError };
