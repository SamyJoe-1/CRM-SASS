const svc = require('./payslips.service');
const asyncHandler = require('../../utils/asyncHandler');
const { success, noContent, paginated } = require('../../utils/response');

const listAll  = asyncHandler(async(req,res)=>{ const r=await svc.listAll(req.tenantId,req.query); paginated(res,r.data,r.meta); });
const listOwn  = asyncHandler(async(req,res)=>{ const r=await svc.listOwn(req.tenantId,req.user.id,req.query); paginated(res,r.data,r.meta); });
const getOne   = asyncHandler(async(req,res)=>{ success(res,await svc.getPayslip(req.tenantId,req.params.id,req.user)); });
const download = asyncHandler(async(req,res)=>{ const f=await svc.downloadPDF(req.tenantId,req.params.id,req.user); res.download(f); });
const markViewed = asyncHandler(async(req,res)=>{ await svc.markViewed(req.tenantId,req.params.id,req.user.id); noContent(res); });

module.exports = { listAll, listOwn, getOne, download, markViewed };
