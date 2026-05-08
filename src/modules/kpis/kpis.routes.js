const router   = require('express').Router();
const ctrl     = require('./kpis.controller');
const auth     = require('../../middleware/authenticate');
const ts       = require('../../middleware/tenantScope');
const authz    = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const { createKpiSchema, updateProgressSchema } = require('./kpis.validator');

router.use(auth, ts);
router.get   ('/',                  authz('kpis:view'),            ctrl.list);
router.post  ('/',                  authz('kpis:create'),          validate(createKpiSchema), ctrl.create);
router.get   ('/dashboard',         authz('kpis:view'),            ctrl.dashboard);
router.get   ('/:id',               authz('kpis:view'),            ctrl.getById);
router.put   ('/:id',               authz('kpis:update'),          validate(createKpiSchema.partial()), ctrl.update);
router.delete('/:id',               authz('kpis:delete'),          ctrl.remove);
router.post  ('/:id/progress',      authz('kpis:update_progress'), validate(updateProgressSchema), ctrl.updateProgress);

module.exports = router;
