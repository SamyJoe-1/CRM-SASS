const svc=require('./analytics.service');
const asyncHandler=require('../../utils/asyncHandler');
const { success }=require('../../utils/response');
const path=require('path');

const overview         =asyncHandler(async(req,res)=>success(res,await svc.overview(req.tenantId)));
const attendanceTrends =asyncHandler(async(req,res)=>success(res,await svc.attendanceTrends(req.tenantId,req.query)));
const payrollTrends    =asyncHandler(async(req,res)=>success(res,await svc.payrollTrends(req.tenantId,req.query)));
const leaveUsage       =asyncHandler(async(req,res)=>success(res,await svc.leaveUsage(req.tenantId,req.query)));
const performance      =asyncHandler(async(req,res)=>success(res,await svc.performanceAverages(req.tenantId,req.query)));
const kpiAchievement   =asyncHandler(async(req,res)=>success(res,await svc.kpiAchievement(req.tenantId)));
const headcount        =asyncHandler(async(req,res)=>success(res,await svc.headcount(req.tenantId,req.query)));
const exportReport     =asyncHandler(async(req,res)=>{
  const { filePath, format } = await svc.exportReport(req.tenantId, req.body);
  res.download(filePath);
});
module.exports={ overview,attendanceTrends,payrollTrends,leaveUsage,performance,kpiAchievement,headcount,exportReport };
