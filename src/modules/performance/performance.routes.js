const router   = require('express').Router();
const ctrl     = require('./performance.controller');
const auth     = require('../../middleware/authenticate');
const ts       = require('../../middleware/tenantScope');
const authz    = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const { createReviewSchema, updateReviewSchema } = require('./performance.validator');

router.use(auth, ts);
router.get   ('/',           authz('performance:view'),        ctrl.list);
router.post  ('/',           authz('performance:create'),      validate(createReviewSchema), ctrl.create);
router.get   ('/stats',      authz('performance:view'),        ctrl.stats);
router.get   ('/:id',        authz('performance:view'),        ctrl.getById);
router.put   ('/:id',        authz('performance:update'),      validate(updateReviewSchema), ctrl.update);
router.delete('/:id',        authz('performance:delete'),      ctrl.remove);
router.post  ('/:id/submit', authz('performance:submit'),      ctrl.submit);
router.post  ('/:id/acknowledge', authz('performance:acknowledge'), ctrl.acknowledge);

module.exports = router;
