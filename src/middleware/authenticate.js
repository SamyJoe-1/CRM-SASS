const jwt          = require('jsonwebtoken');
const env          = require('../config/env');
const db           = require('../config/database');
const { UnauthorizedError } = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

module.exports = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) throw new UnauthorizedError('No token provided');

  const token = header.slice(7);
  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }

  const user = await db('users').where({ id: decoded.userId, deleted_at: null }).first();
  if (!user)          throw new UnauthorizedError('User not found');
  if (!user.is_active) throw new UnauthorizedError('Account deactivated');

  req.user     = user;
  req.tenantId = user.tenant_id;
  next();
});
