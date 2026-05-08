const { v4: uuidv4 } = require('uuid');
const { DateTime }   = require('luxon');
const db             = require('../../config/database');
const { NotFoundError, BusinessError, ConflictError } = require('../../utils/AppError');
const { getPagination, buildMeta } = require('../../utils/pagination');
const { applyFilters } = require('../../utils/filterBuilder');
const notifSvc = require('../notifications/notifications.service');

// ── Leave Types ───────────────────────────────────────────────────────────────
const listTypes = (tenantId) =>
  db('leave_types').where({ tenant_id: tenantId, deleted_at: null }).orderBy('name');

const createType = async (tenantId, data) => {
  const now = new Date().toISOString();
  const id  = uuidv4();
  await db('leave_types').insert({ id, tenant_id: tenantId, ...data, created_at: now, updated_at: now });
  return db('leave_types').where({ id }).first();
};

const updateType = async (tenantId, id, data) => {
  const lt = await db('leave_types').where({ id, tenant_id: tenantId, deleted_at: null }).first();
  if (!lt) throw new NotFoundError('Leave type not found');
  await db('leave_types').where({ id }).update({ ...data, updated_at: new Date().toISOString() });
  return db('leave_types').where({ id }).first();
};

const deleteType = async (tenantId, id) => {
  const lt = await db('leave_types').where({ id, tenant_id: tenantId, deleted_at: null }).first();
  if (!lt) throw new NotFoundError('Leave type not found');
  await db('leave_types').where({ id }).update({ deleted_at: new Date().toISOString() });
};

// ── Leave Requests ────────────────────────────────────────────────────────────
const countBusinessDays = (startDate, endDate) => {
  let count = 0;
  let cur   = DateTime.fromISO(startDate);
  const end = DateTime.fromISO(endDate);
  while (cur <= end) {
    if (cur.weekday <= 5) count++;
    cur = cur.plus({ days: 1 });
  }
  return count;
};

const listRequests = async (tenantId, query) => {
  const { page, per_page, offset } = getPagination(query);
  const base = () => db('leave_requests').where({ 'leave_requests.tenant_id': tenantId, 'leave_requests.deleted_at': null });
  let q = base()
    .leftJoin('employees',  'employees.id',   'leave_requests.employee_id')
    .leftJoin('leave_types','leave_types.id',  'leave_requests.leave_type_id')
    .select('leave_requests.*','employees.first_name','employees.last_name','leave_types.name as leave_type_name');
  applyFilters(q, query, { allowedSortCols:['start_date','created_at','status'], tableAlias:'leave_requests' });
  const [{ count }] = await base().count('leave_requests.id as count');
  const data        = await q.limit(per_page).offset(offset);
  return { data, meta: buildMeta(page, per_page, Number(count)) };
};

const createRequest = async (tenantId, data) => {
  const { employee_id, leave_type_id, start_date, end_date, reason } = data;
  const days = countBusinessDays(start_date, end_date);
  if (days <= 0) throw new BusinessError('Invalid date range');

  const year    = new Date(start_date).getFullYear();
  const balance = await db('leave_balances')
    .where({ tenant_id: tenantId, employee_id, leave_type_id, year })
    .first();

  if (!balance) throw new NotFoundError('Leave balance not found for this year');
  const available = balance.total_days - balance.used_days - balance.pending_days;
  if (available < days) throw new BusinessError(`Insufficient leave balance. Available: ${available}, Requested: ${days}`);

  const now = new Date().toISOString();
  const id  = uuidv4();
  await db('leave_requests').insert({
    id, tenant_id: tenantId, employee_id, leave_type_id,
    start_date, end_date, days_requested: days, reason,
    status: 'pending', created_at: now, updated_at: now,
  });

  await db('leave_balances').where({ id: balance.id }).update({
    pending_days: balance.pending_days + days, updated_at: now,
  });

  return db('leave_requests').where({ id }).first();
};

const approveRequest = async (tenantId, requestId, reviewerId, { review_notes }) => {
  const req = await db('leave_requests').where({ id: requestId, tenant_id: tenantId }).first();
  if (!req) throw new NotFoundError('Leave request not found');
  if (req.status !== 'pending') throw new BusinessError('Only pending requests can be approved');

  const now  = new Date().toISOString();
  const year = new Date(req.start_date).getFullYear();

  await db('leave_requests').where({ id: requestId }).update({
    status: 'approved', reviewed_by: reviewerId, reviewed_at: now, review_notes, updated_at: now,
  });

  // deduct from balance
  const balance = await db('leave_balances')
    .where({ tenant_id: tenantId, employee_id: req.employee_id, leave_type_id: req.leave_type_id, year }).first();
  if (balance) {
    await db('leave_balances').where({ id: balance.id }).update({
      used_days:    balance.used_days    + req.days_requested,
      pending_days: Math.max(0, balance.pending_days - req.days_requested),
      updated_at: now,
    });
  }

  // mark attendance records
  let cur = DateTime.fromISO(req.start_date);
  const end = DateTime.fromISO(req.end_date);
  while (cur <= end) {
    if (cur.weekday <= 5) {
      const existing = await db('attendance_records')
        .where({ tenant_id: tenantId, employee_id: req.employee_id, date: cur.toISODate() }).first();
      if (existing) {
        await db('attendance_records').where({ id: existing.id }).update({ status:'on_leave', updated_at:now });
      } else {
        await db('attendance_records').insert({
          id: uuidv4(), tenant_id: tenantId, employee_id: req.employee_id,
          date: cur.toISODate(), status:'on_leave', worked_minutes:0, overtime_minutes:0, late_minutes:0,
          created_at:now, updated_at:now,
        });
      }
    }
    cur = cur.plus({ days: 1 });
  }

  // notify employee
  const emp = await db('employees').where({ id: req.employee_id }).first();
  if (emp && emp.user_id) {
    await notifSvc.createNotification(tenantId, {
      user_id: emp.user_id, type:'leave_approved',
      title:'Leave Request Approved',
      body:`Your leave request from ${req.start_date} to ${req.end_date} has been approved.`,
    });
  }

  return db('leave_requests').where({ id: requestId }).first();
};

const rejectRequest = async (tenantId, requestId, reviewerId, { review_notes }) => {
  const req = await db('leave_requests').where({ id: requestId, tenant_id: tenantId }).first();
  if (!req) throw new NotFoundError('Leave request not found');
  if (req.status !== 'pending') throw new BusinessError('Only pending requests can be rejected');

  const now  = new Date().toISOString();
  const year = new Date(req.start_date).getFullYear();

  await db('leave_requests').where({ id: requestId }).update({
    status: 'rejected', reviewed_by: reviewerId, reviewed_at: now, review_notes, updated_at: now,
  });

  const balance = await db('leave_balances')
    .where({ tenant_id: tenantId, employee_id: req.employee_id, leave_type_id: req.leave_type_id, year }).first();
  if (balance) {
    await db('leave_balances').where({ id: balance.id }).update({
      pending_days: Math.max(0, balance.pending_days - req.days_requested), updated_at: now,
    });
  }

  const emp = await db('employees').where({ id: req.employee_id }).first();
  if (emp && emp.user_id) {
    await notifSvc.createNotification(tenantId, {
      user_id: emp.user_id, type:'leave_rejected',
      title:'Leave Request Rejected',
      body:`Your leave request from ${req.start_date} to ${req.end_date} has been rejected.`,
    });
  }
  return db('leave_requests').where({ id: requestId }).first();
};

const cancelRequest = async (tenantId, requestId, userId) => {
  const req = await db('leave_requests').where({ id: requestId, tenant_id: tenantId }).first();
  if (!req) throw new NotFoundError('Leave request not found');
  if (!['pending','approved'].includes(req.status)) throw new BusinessError('Cannot cancel this request');

  const now  = new Date().toISOString();
  const year = new Date(req.start_date).getFullYear();

  await db('leave_requests').where({ id: requestId }).update({ status:'cancelled', updated_at: now });

  // restore balance
  const balance = await db('leave_balances')
    .where({ tenant_id: tenantId, employee_id: req.employee_id, leave_type_id: req.leave_type_id, year }).first();
  if (balance) {
    const restoreUsed    = req.status === 'approved' ? req.days_requested : 0;
    const restorePending = req.status === 'pending'  ? req.days_requested : 0;
    await db('leave_balances').where({ id: balance.id }).update({
      used_days:    Math.max(0, balance.used_days    - restoreUsed),
      pending_days: Math.max(0, balance.pending_days - restorePending),
      updated_at:   now,
    });
  }
};

const listBalances = async (tenantId, employeeId) => {
  const year = new Date().getFullYear();
  return db('leave_balances')
    .where({ tenant_id: tenantId, employee_id: employeeId, year })
    .leftJoin('leave_types','leave_types.id','leave_balances.leave_type_id')
    .select('leave_balances.*','leave_types.name as leave_type_name');
};

const calendarView = async (tenantId, year, month) => {
  return db('leave_requests')
    .where({ tenant_id: tenantId, status: 'approved' })
    .whereRaw("strftime('%Y', start_date) = ? OR strftime('%Y', end_date) = ?", [String(year), String(year)])
    .leftJoin('employees','employees.id','leave_requests.employee_id')
    .leftJoin('leave_types','leave_types.id','leave_requests.leave_type_id')
    .select('leave_requests.*','employees.first_name','employees.last_name','leave_types.name as leave_type_name');
};

module.exports = { listTypes, createType, updateType, deleteType, listRequests, createRequest, approveRequest, rejectRequest, cancelRequest, listBalances, calendarView };
