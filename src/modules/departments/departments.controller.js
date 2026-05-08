const svc=require('./departments.service');
const asyncHandler=require('../../utils/asyncHandler');
const { success,created,noContent }=require('../../utils/response');
const { z }=require('zod');
const validate=require('../../middleware/validate');

const schema=z.object({ name:z.string().min(1).max(100), name_ar:z.string().max(100).optional(), description:z.string().max(500).optional(), manager_id:z.string().uuid().optional().nullable() });

const list    =asyncHandler(async(req,res)=>success(res,await svc.list(req.tenantId)));
const getById =asyncHandler(async(req,res)=>success(res,await svc.getById(req.tenantId,req.params.id)));
const create  =asyncHandler(async(req,res)=>created(res,await svc.create(req.tenantId,req.validated)));
const update  =asyncHandler(async(req,res)=>success(res,await svc.update(req.tenantId,req.params.id,req.validated)));
const remove  =asyncHandler(async(req,res)=>{ await svc.remove(req.tenantId,req.params.id); noContent(res); });
module.exports={ list,getById,create,update,remove,schema };
