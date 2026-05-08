const svc = require('./performance.service');
const asyncHandler = require('../../utils/asyncHandler');
const { success, created, noContent, paginated } = require('../../utils/response');

const list        = asyncHandler(async(req,res)=>{ const r=await svc.list(req.tenantId,req.query); paginated(res,r.data,r.meta); });
const getById     = asyncHandler(async(req,res)=>{ success(res,await svc.getById(req.tenantId,req.params.id)); });
const create      = asyncHandler(async(req,res)=>{ created(res,await svc.create(req.tenantId,req.user.id,req.validated)); });
const update      = asyncHandler(async(req,res)=>{ success(res,await svc.update(req.tenantId,req.params.id,req.validated)); });
const remove      = asyncHandler(async(req,res)=>{ await svc.remove(req.tenantId,req.params.id); noContent(res); });
const submit      = asyncHandler(async(req,res)=>{ success(res,await svc.submit(req.tenantId,req.params.id)); });
const acknowledge = asyncHandler(async(req,res)=>{ success(res,await svc.acknowledge(req.tenantId,req.params.id,req.user.id)); });
const stats       = asyncHandler(async(req,res)=>{ success(res,await svc.summaryStats(req.tenantId,req.query)); });

module.exports = { list,getById,create,update,remove,submit,acknowledge,stats };
