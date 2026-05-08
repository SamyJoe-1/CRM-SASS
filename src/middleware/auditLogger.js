const db           = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger       = require('../utils/logger');

/**
 * Factory – call as auditLogger('employees','create') on specific routes.
 * Runs AFTER the controller so req.auditMeta can be set by the controller.
 */
const auditLogger = (module, action) => async (req, res, next) => {
  // attach hook for controller to set record id
  res.on('finish', async () => {
    if (res.statusCode >= 400) return;
    try {
      await db('audit_logs').insert({
        id:          uuidv4(),
        tenant_id:   req.tenantId || null,
        user_id:     req.user ? req.user.id : null,
        module,
        action,
        record_id:   req.auditRecordId || req.params.id || null,
        ip_address:  (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim(),
        user_agent:  req.headers['user-agent'] || '',
        changes:     req.auditChanges ? JSON.stringify(req.auditChanges) : null,
        created_at:  new Date().toISOString(),
        updated_at:  new Date().toISOString(),
      });
    } catch (e) {
      logger.error('AuditLogger failed', { error: e.message });
    }
  });
  next();
};

module.exports = auditLogger;
