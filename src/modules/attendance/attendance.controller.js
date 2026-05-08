const svc        = require('./attendance.service');
const asyncHandler = require('../../utils/asyncHandler');
const { success, paginated } = require('../../utils/response');

const getPolicy     = asyncHandler(async (req,res) => { success(res, await svc.getPolicy(req.tenantId)); });
const upsertPolicy  = asyncHandler(async (req,res) => { success(res, await svc.upsertPolicy(req.tenantId, req.validated)); });
const clockIn       = asyncHandler(async (req,res) => { success(res, await svc.clockIn(req.tenantId, req.validated, req)); });
const clockOut      = asyncHandler(async (req,res) => { success(res, await svc.clockOut(req.tenantId, req.validated)); });
const listRecords   = asyncHandler(async (req,res) => { const r = await svc.listRecords(req.tenantId, req.query); paginated(res, r.data, r.meta); });
const manualEdit    = asyncHandler(async (req,res) => { success(res, await svc.manualEdit(req.tenantId, req.params.id, req.validated, req.user.id)); });
const summary       = asyncHandler(async (req,res) => { success(res, await svc.monthlySummary(req.tenantId, req.params.employeeId, req.query.year || new Date().getFullYear(), req.query.month || new Date().getMonth()+1)); });
const exportRecords = asyncHandler(async (req,res) => { const f = await svc.exportRecords(req.tenantId, req.query, req.query.format||'xlsx'); res.download(f); });

module.exports = { getPolicy, upsertPolicy, clockIn, clockOut, listRecords, manualEdit, summary, exportRecords };
