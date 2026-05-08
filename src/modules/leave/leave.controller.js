const svc = require('./leave.service');
const asyncHandler = require('../../utils/asyncHandler');
const { success, created, noContent, paginated } = require('../../utils/response');

const listTypes    = asyncHandler(async (req,res) => { success(res, await svc.listTypes(req.tenantId)); });
const createType   = asyncHandler(async (req,res) => { created(res, await svc.createType(req.tenantId, req.validated)); });
const updateType   = asyncHandler(async (req,res) => { success(res, await svc.updateType(req.tenantId, req.params.id, req.validated)); });
const deleteType   = asyncHandler(async (req,res) => { await svc.deleteType(req.tenantId, req.params.id); noContent(res); });
const listRequests = asyncHandler(async (req,res) => { const r = await svc.listRequests(req.tenantId, req.query); paginated(res, r.data, r.meta); });
const createRequest= asyncHandler(async (req,res) => { created(res, await svc.createRequest(req.tenantId, req.validated)); });
const approve      = asyncHandler(async (req,res) => { success(res, await svc.approveRequest(req.tenantId, req.params.id, req.user.id, req.validated)); });
const reject       = asyncHandler(async (req,res) => { success(res, await svc.rejectRequest(req.tenantId, req.params.id, req.user.id, req.validated)); });
const cancel       = asyncHandler(async (req,res) => { await svc.cancelRequest(req.tenantId, req.params.id, req.user.id); noContent(res); });
const balances     = asyncHandler(async (req,res) => { success(res, await svc.listBalances(req.tenantId, req.params.employeeId)); });
const calendar     = asyncHandler(async (req,res) => { success(res, await svc.calendarView(req.tenantId, req.query.year||new Date().getFullYear(), req.query.month||new Date().getMonth()+1)); });

module.exports = { listTypes, createType, updateType, deleteType, listRequests, createRequest, approve, reject, cancel, balances, calendar };
