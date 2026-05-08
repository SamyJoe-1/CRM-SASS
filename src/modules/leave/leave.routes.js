const router   = require('express').Router();
const ctrl     = require('./leave.controller');
const auth     = require('../../middleware/authenticate');
const ts       = require('../../middleware/tenantScope');
const authz    = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const { leaveTypeSchema, leaveRequestSchema, reviewSchema } = require('./leave.validator');

router.use(auth, ts);

// Types
router.get   ('/types',          authz('leave:view'),         ctrl.listTypes);
router.post  ('/types',          authz('leave:types_manage'), validate(leaveTypeSchema), ctrl.createType);
router.put   ('/types/:id',      authz('leave:types_manage'), validate(leaveTypeSchema), ctrl.updateType);
router.delete('/types/:id',      authz('leave:types_manage'), ctrl.deleteType);

// Requests
router.get   ('/requests',       authz('leave:view'),    ctrl.listRequests);
router.post  ('/requests',       authz('leave:request'), validate(leaveRequestSchema), ctrl.createRequest);
router.post  ('/requests/:id/approve', authz('leave:approve'), validate(reviewSchema), ctrl.approve);
router.post  ('/requests/:id/reject',  authz('leave:reject'),  validate(reviewSchema), ctrl.reject);
router.post  ('/requests/:id/cancel',  authz('leave:request'), ctrl.cancel);

router.get   ('/balances/:employeeId', authz('leave:view'), ctrl.balances);
router.get   ('/calendar',        authz('leave:view'),       ctrl.calendar);

module.exports = router;
