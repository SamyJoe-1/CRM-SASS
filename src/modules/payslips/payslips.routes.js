const router = require('express').Router();
const ctrl   = require('./payslips.controller');
const auth   = require('../../middleware/authenticate');
const ts     = require('../../middleware/tenantScope');
const authz  = require('../../middleware/authorize');

router.use(auth, ts);
router.get('/',              authz('payslips:view_all'), ctrl.listAll);
router.get('/mine',          authz('payslips:view_own'), ctrl.listOwn);
router.get('/:id',           authz('payslips:view_own'), ctrl.getOne);
router.get('/:id/download',  authz('payslips:view_own'), ctrl.download);
router.post('/:id/viewed',   authz('payslips:view_own'), ctrl.markViewed);

module.exports = router;
