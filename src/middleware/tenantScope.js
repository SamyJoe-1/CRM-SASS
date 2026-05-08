const { ForbiddenError } = require('../utils/AppError');

/**
 * Ensures req.tenantId is set (by authenticate).
 * Attaches helper db.forTenant(table) to the request.
 */
module.exports = (req, res, next) => {
  if (!req.tenantId) throw new ForbiddenError('Tenant context missing');
  next();
};
