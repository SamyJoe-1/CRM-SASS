const svc = require('./kpis.service');
const asyncHandler = require('../../utils/asyncHandler');
const { success, created, noContent, paginated } = require('../../utils/response');

const list           = asyncHandler(async(req,res)=>{ const r=await svc.list(req.tenantId,req.query); paginated(res,r.data,r.meta); });
const getById        = asyncHandler(async(req,res)=>{ success(res,await svc.getById(req.tenantId,req.params.id)); });
const create         = asyncHandler(async(req,res)=>{ created(res,await svc.create(req.tenantId,req.user.id,req.validated)); });
const update         = asyncHandler(async(req,res)=>{ success(res,await svc.update(req.tenantId,req.params.id,req.validated)); });
const remove         = asyncHandler(async(req,res)=>{ await svc.remove(req.tenantId,req.params.id); noContent(res); });
const updateProgress = asyncHandler(async(req,res)=>{ success(res,await svc.updateProgress(req.tenantId,req.params.id,req.user.id,req.validated)); });
const dashboard      = asyncHandler(async(req,res)=>{ success(res,await svc.dashboard(req.tenantId)); });

module.exports = { list,getById,create,update,remove,updateProgress,dashboard };
