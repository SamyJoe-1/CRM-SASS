const svc        = require('./employees.service');
const asyncHandler = require('../../utils/asyncHandler');
const { success, created, noContent, paginated } = require('../../utils/response');
const path = require('path');

const list           = asyncHandler(async (req, res) => { const r = await svc.list(req.tenantId, req.query); paginated(res, r.data, r.meta); });
const getById        = asyncHandler(async (req, res) => { success(res, await svc.getById(req.tenantId, req.params.id)); });
const create         = asyncHandler(async (req, res) => { created(res, await svc.create(req.tenantId, req.validated)); });
const update         = asyncHandler(async (req, res) => { success(res, await svc.update(req.tenantId, req.params.id, req.validated)); });
const softDelete     = asyncHandler(async (req, res) => { await svc.softDelete(req.tenantId, req.params.id); noContent(res); });
const terminate      = asyncHandler(async (req, res) => { success(res, await svc.terminate(req.tenantId, req.params.id, req.validated)); });
const uploadDocument = asyncHandler(async (req, res) => { created(res, await svc.uploadDocument(req.tenantId, req.params.id, req.file, req.user.id)); });
const listDocuments  = asyncHandler(async (req, res) => { success(res, await svc.listDocuments(req.tenantId, req.params.id)); });
const deleteDocument = asyncHandler(async (req, res) => { await svc.deleteDocument(req.tenantId, req.params.id, req.params.docId); noContent(res); });

const exportData = asyncHandler(async (req, res) => {
  const fmt      = req.query.format || 'xlsx';
  const filePath = await svc.exportEmployees(req.tenantId, req.query, fmt);
  res.download(filePath);
});

module.exports = { list, getById, create, update, softDelete, terminate, uploadDocument, listDocuments, deleteDocument, exportData };
