const svc=require('./audit.service');
const asyncHandler=require('../../utils/asyncHandler');
const { paginated }=require('../../utils/response');
const list      =asyncHandler(async(req,res)=>{ const r=await svc.list(req.tenantId,req.query); paginated(res,r.data,r.meta); });
const exportLogs=asyncHandler(async(req,res)=>{ const f=await svc.exportLogs(req.tenantId,req.query,req.query.format||'xlsx'); res.download(f); });
module.exports={ list,exportLogs };
