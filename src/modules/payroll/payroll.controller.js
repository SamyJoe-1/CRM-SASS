const svc = require('./payroll.service');
const asyncHandler = require('../../utils/asyncHandler');
const { success, created, noContent, paginated } = require('../../utils/response');

const listCycles     = asyncHandler(async(req,res)=>{ const r=await svc.listCycles(req.tenantId,req.query); paginated(res,r.data,r.meta); });
const createCycle    = asyncHandler(async(req,res)=>{ created(res,await svc.createCycle(req.tenantId,req.validated)); });
const getCycle       = asyncHandler(async(req,res)=>{ success(res,await svc.getCycle(req.tenantId,req.params.id)); });
const deleteCycle    = asyncHandler(async(req,res)=>{ await svc.deleteCycle(req.tenantId,req.params.id); noContent(res); });
const generate       = asyncHandler(async(req,res)=>{ success(res,await svc.generateRecords(req.tenantId,req.params.id)); });
const listRecords    = asyncHandler(async(req,res)=>{ const r=await svc.listRecords(req.tenantId,req.params.id,req.query); paginated(res,r.data,r.meta); });
const editRecord     = asyncHandler(async(req,res)=>{ success(res,await svc.editRecord(req.tenantId,req.params.id,req.params.recordId,req.validated)); });
const processOne     = asyncHandler(async(req,res)=>{ success(res,await svc.processOne(req.tenantId,req.params.id,req.params.recordId,req.user.id)); });
const processAll     = asyncHandler(async(req,res)=>{ success(res,await svc.processAll(req.tenantId,req.params.id,req.user.id)); });
const cancelOne      = asyncHandler(async(req,res)=>{ await svc.cancelOne(req.tenantId,req.params.id,req.params.recordId); noContent(res); });
const cancelAll      = asyncHandler(async(req,res)=>{ await svc.cancelAll(req.tenantId,req.params.id); noContent(res); });
const summary        = asyncHandler(async(req,res)=>{ success(res,await svc.summary(req.tenantId,req.params.id)); });
const exportRecords  = asyncHandler(async(req,res)=>{ const f=await svc.exportRecords(req.tenantId,req.params.id,req.query.format||'xlsx'); res.download(f); });

module.exports = { listCycles,createCycle,getCycle,deleteCycle,generate,listRecords,editRecord,processOne,processAll,cancelOne,cancelAll,summary,exportRecords };
