const db              = require('../config/database');
const { ForbiddenError } = require('../utils/AppError');
const asyncHandler    = require('../utils/asyncHandler');

/**
 * Permission resolution order:
 * 1. User-level DENY  → forbidden immediately
 * 2. User-level GRANT → allowed immediately
 * 3. Role default     → check role_permissions
 * 4. Otherwise        → forbidden
 */
const authorize = (permissionKey) => asyncHandler(async (req, res, next) => {
  const { user } = req;
  if (!user) throw new ForbiddenError();

  // super_admin bypasses all permission checks
  if (user.role_name === 'super_admin') return next();

  // 1 & 2: user-level overrides
  const override = await db('user_permissions')
    .join('permissions', 'permissions.id', 'user_permissions.permission_id')
    .where({ 'user_permissions.user_id': user.id, 'permissions.key': permissionKey })
    .select('user_permissions.type')
    .first();

  if (override) {
    if (override.type === 'deny')  throw new ForbiddenError('Permission denied');
    if (override.type === 'grant') return next();
  }

  // 3: role default
  const rolePerm = await db('role_permissions')
    .join('permissions', 'permissions.id', 'role_permissions.permission_id')
    .where({ 'role_permissions.role_id': user.role_id, 'permissions.key': permissionKey })
    .first();

  if (rolePerm) return next();

  throw new ForbiddenError('You do not have permission to perform this action');
});

module.exports = authorize;
