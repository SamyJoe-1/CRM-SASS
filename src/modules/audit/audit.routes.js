const router=require('express').Router();
const ctrl=require('./audit.controller');
const auth=require('../../middleware/authenticate');
const ts=require('../../middleware/tenantScope');
const authz=require('../../middleware/authorize');
router.use(auth,ts);
router.get('/        ', authz('audit:view'),   ctrl.list);
router.get('/export',   authz('audit:export'), ctrl.exportLogs);
module.exports=router;
