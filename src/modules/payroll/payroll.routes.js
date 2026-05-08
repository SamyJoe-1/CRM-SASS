const router   = require('express').Router();
const ctrl     = require('./payroll.controller');
const auth     = require('../../middleware/authenticate');
const ts       = require('../../middleware/tenantScope');
const authz    = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const { createCycleSchema, editRecordSchema } = require('./payroll.validator');

router.use(auth, ts);

router.get   ('/',                          authz('payroll:view'),    ctrl.listCycles);
router.post  ('/',                          authz('payroll:process'), validate(createCycleSchema), ctrl.createCycle);
router.get   ('/:id',                       authz('payroll:view'),    ctrl.getCycle);
router.delete('/:id',                       authz('payroll:cancel'),  ctrl.deleteCycle);
router.post  ('/:id/generate',              authz('payroll:process'), ctrl.generate);
router.get   ('/:id/records',               authz('payroll:view'),    ctrl.listRecords);
router.put   ('/:id/records/:recordId',     authz('payroll:process'), validate(editRecordSchema), ctrl.editRecord);
router.post  ('/:id/records/:recordId/process', authz('payroll:process'), ctrl.processOne);
router.post  ('/:id/process-all',           authz('payroll:process'), ctrl.processAll);
router.post  ('/:id/records/:recordId/cancel', authz('payroll:cancel'), ctrl.cancelOne);
router.post  ('/:id/cancel-all',            authz('payroll:cancel'),  ctrl.cancelAll);
router.get   ('/:id/summary',               authz('payroll:view'),    ctrl.summary);
router.get   ('/:id/export',                authz('payroll:export'),  ctrl.exportRecords);

module.exports = router;
