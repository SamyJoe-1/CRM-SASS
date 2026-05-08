const router   = require('express').Router();
const ctrl     = require('./attendance.controller');
const auth     = require('../../middleware/authenticate');
const ts       = require('../../middleware/tenantScope');
const authz    = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const { clockInSchema, clockOutSchema, manualEditSchema, policySchema } = require('./attendance.validator');

router.use(auth, ts);

router.get  ('/policy',          authz('attendance:view'),        ctrl.getPolicy);
router.put  ('/policy',          authz('attendance:policy_edit'), validate(policySchema), ctrl.upsertPolicy);
router.post ('/clock-in',        authz('attendance:clock_in'),    validate(clockInSchema),  ctrl.clockIn);
router.post ('/clock-out',       authz('attendance:clock_out'),   validate(clockOutSchema), ctrl.clockOut);
router.get  ('/records',         authz('attendance:view'),        ctrl.listRecords);
router.put  ('/records/:id',     authz('attendance:edit'),        validate(manualEditSchema), ctrl.manualEdit);
router.get  ('/summary/:employeeId', authz('attendance:view'),    ctrl.summary);
router.get  ('/export',          authz('attendance:export'),      ctrl.exportRecords);

module.exports = router;
