const svc=require('./settings.service');
const asyncHandler=require('../../utils/asyncHandler');
const { success }=require('../../utils/response');
const { z }=require('zod');
const validate=require('../../middleware/validate');

const tenantSchema=z.object({ name:z.string().min(1).optional(), language:z.enum(['en','ar']).optional(), timezone:z.string().optional(), logo_url:z.string().url().optional().nullable(), address:z.string().optional(), phone:z.string().optional(), email:z.string().email().optional() });
const payrollSchema=z.object({ insurance_rate:z.number().min(0).max(1).optional(), insurance_cap:z.number().min(0).optional(), working_days_per_month:z.number().int().min(1).max(31).optional() });

const getGeneral    =asyncHandler(async(req,res)=>success(res,await svc.getTenant(req.tenantId)));
const updateGeneral =asyncHandler(async(req,res)=>success(res,await svc.updateTenant(req.tenantId,req.validated)));
const getPayroll    =asyncHandler(async(req,res)=>success(res,await svc.getPayrollConfig(req.tenantId)));
const updatePayroll =asyncHandler(async(req,res)=>success(res,await svc.updatePayrollConfig(req.tenantId,req.validated)));
const listRoles     =asyncHandler(async(req,res)=>success(res,await svc.listRoles(req.tenantId)));
const listUsers     =asyncHandler(async(req,res)=>success(res,await svc.listUsers(req.tenantId)));
module.exports={ getGeneral,updateGeneral,getPayroll,updatePayroll,listRoles,listUsers,tenantSchema,payrollSchema };
