const router   = require('express').Router();
const ctrl     = require('./employees.controller');
const auth     = require('../../middleware/authenticate');
const ts       = require('../../middleware/tenantScope');
const authz    = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const upload   = require('../../middleware/upload');
const audit    = require('../../middleware/auditLogger');
const { createEmployeeSchema, updateEmployeeSchema, terminateSchema } = require('./employees.validator');

router.use(auth, ts);

router.get   ('/',              authz('employees:view'),      ctrl.list);
router.post  ('/',              authz('employees:create'),    validate(createEmployeeSchema), audit('employees','create'), ctrl.create);
router.get   ('/export',        authz('employees:export'),    ctrl.exportData);
router.get   ('/:id',           authz('employees:view'),      ctrl.getById);
router.put   ('/:id',           authz('employees:update'),    validate(updateEmployeeSchema), audit('employees','update'), ctrl.update);
router.delete('/:id',           authz('employees:delete'),    audit('employees','delete'),    ctrl.softDelete);
router.post  ('/:id/terminate', authz('employees:terminate'), validate(terminateSchema),       audit('employees','terminate'), ctrl.terminate);
router.post  ('/:id/documents', authz('employees:update'),    upload.single('file'),           ctrl.uploadDocument);
router.get   ('/:id/documents', authz('employees:view'),      ctrl.listDocuments);
router.delete('/:id/documents/:docId', authz('employees:update'), ctrl.deleteDocument);

module.exports = router;
