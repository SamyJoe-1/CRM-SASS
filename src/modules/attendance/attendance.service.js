const { v4: uuidv4 }   = require('uuid');
const { DateTime }       = require('luxon');
const db                 = require('../../config/database');
const { encrypt }        = require('../../utils/networkHelper');
const { validateNetworkAccess } = require('../../utils/networkHelper');
const { NotFoundError, BusinessError, ConflictError } = require('../../utils/AppError');
const { getPagination, buildMeta } = require('../../utils/pagination');
const { applyFilters }             = require('../../utils/filterBuilder');
const { toExcel, toCsv, toPdf }   = require('../../utils/exportHelper');

const getPolicy = async (tenantId) => {
  const p = await db('attendance_policies').where({ tenant_id: tenantId, deleted_at: null }).first();
  if (!p) throw new NotFoundError('Attendance policy not configured');
  return p;
};

const upsertPolicy = async (tenantId, data) => {
  const now     = new Date().toISOString();
  const existing = await db('attendance_policies').where({ tenant_id: tenantId }).first();
  const payload  = {
    work_start_time:       data.work_start_time,
    work_end_time:         data.work_end_time,
    grace_minutes:         data.grace_minutes,
    working_days_per_week: data.working_days_per_week,
    working_days_json:     JSON.stringify(data.working_days_json),
    enforce_network_check: data.enforce_network_check ? 1 : 0,
    updated_at:            now,
  };
  if (data.allowed_ips)   payload.allowed_ips_encrypted   = encrypt(JSON.stringify(data.allowed_ips));
  if (data.allowed_ssids) payload.allowed_ssids_encrypted = encrypt(JSON.stringify(data.allowed_ssids));

  if (existing) {
    await db('attendance_policies').where({ tenant_id: tenantId }).update(payload);
  } else {
    await db('attendance_policies').insert({ id: uuidv4(), tenant_id: tenantId, ...payload, created_at: now });
  }
  // return WITHOUT encrypted fields
  const result = await db('attendance_policies').where({ tenant_id: tenantId }).first();
  const { allowed_ips_encrypted, allowed_ssids_encrypted, ...safe } = result;
  return safe;
};

const clockIn = async (tenantId, { employee_id, notes }, req) => {
  const policy = await getPolicy(tenantId);

  if (policy.enforce_network_check) {
    const { allowed } = validateNetworkAccess(req, policy);
    if (!allowed) throw new BusinessError('Unable to verify your location');
  }

  const now     = new Date().toISOString();
  const today   = DateTime.now().toISODate();
  const existing = await db('attendance_records').where({ tenant_id: tenantId, employee_id, date: today }).first();
  if (existing && existing.clock_in_at) throw new ConflictError('Already clocked in today');

  const clockInDT    = DateTime.now();
  const [startH, startM] = policy.work_start_time.split(':').map(Number);
  const workStart    = clockInDT.set({ hour: startH, minute: startM, second: 0 });
  const lateMinutes  = Math.max(0, Math.floor(clockInDT.diff(workStart, 'minutes').minutes) - policy.grace_minutes);
  const status       = lateMinutes > 0 ? 'late' : 'present';

  if (existing) {
    await db('attendance_records').where({ id: existing.id }).update({
      clock_in_at: now, late_minutes: lateMinutes, status, notes, updated_at: now,
    });
    return db('attendance_records').where({ id: existing.id }).first();
  }

  const id = uuidv4();
  await db('attendance_records').insert({
    id, tenant_id: tenantId, employee_id, date: today,
    clock_in_at: now, late_minutes: lateMinutes, status, notes,
    worked_minutes: 0, overtime_minutes: 0,
    created_at: now, updated_at: now,
  });
  return db('attendance_records').where({ id }).first();
};

const clockOut = async (tenantId, { employee_id, notes }) => {
  const policy  = await getPolicy(tenantId);
  const today   = DateTime.now().toISODate();
  const record  = await db('attendance_records').where({ tenant_id: tenantId, employee_id, date: today }).first();
  if (!record || !record.clock_in_at) throw new BusinessError('No clock-in record found for today');
  if (record.clock_out_at) throw new ConflictError('Already clocked out today');

  const now       = new Date().toISOString();
  const inDT      = DateTime.fromISO(record.clock_in_at);
  const outDT     = DateTime.now();
  const worked    = Math.floor(outDT.diff(inDT, 'minutes').minutes);
  const [endH, endM] = policy.work_end_time.split(':').map(Number);
  const workEnd   = outDT.set({ hour: endH, minute: endM, second: 0 });
  const overtime  = Math.max(0, Math.floor(outDT.diff(workEnd, 'minutes').minutes));

  await db('attendance_records').where({ id: record.id }).update({
    clock_out_at: now, worked_minutes: worked, overtime_minutes: overtime, notes: notes || record.notes,
    updated_at: now,
  });
  return db('attendance_records').where({ id: record.id }).first();
};

const listRecords = async (tenantId, query) => {
  const { page, per_page, offset } = getPagination(query);
  const base = () => db('attendance_records').where({ 'attendance_records.tenant_id': tenantId, 'attendance_records.deleted_at': null });

  let q = base()
    .leftJoin('employees','employees.id','attendance_records.employee_id')
    .select('attendance_records.*','employees.first_name','employees.last_name','employees.employee_number');

  applyFilters(q, query, { allowedSortCols: ['date','clock_in_at','worked_minutes'], tableAlias:'attendance_records' });

  if (query.date_from) q.where('attendance_records.date','>=', query.date_from);
  if (query.date_to)   q.where('attendance_records.date','<=', query.date_to);

  const [{ count }] = await base().count('attendance_records.id as count');
  const data        = await q.limit(per_page).offset(offset);
  return { data, meta: buildMeta(page, per_page, Number(count)) };
};

const manualEdit = async (tenantId, recordId, data, editorId) => {
  const record = await db('attendance_records').where({ id: recordId, tenant_id: tenantId }).first();
  if (!record) throw new NotFoundError('Record not found');

  const payload = { ...data, edited_by: editorId, updated_at: new Date().toISOString() };

  if (data.clock_in_at && data.clock_out_at) {
    const inDT  = DateTime.fromISO(data.clock_in_at);
    const outDT = DateTime.fromISO(data.clock_out_at);
    payload.worked_minutes   = Math.max(0, Math.floor(outDT.diff(inDT,'minutes').minutes));
    payload.overtime_minutes = Math.max(0, payload.worked_minutes - 480);
  }

  await db('attendance_records').where({ id: recordId }).update(payload);
  return db('attendance_records').where({ id: recordId }).first();
};

const monthlySummary = async (tenantId, employeeId, year, month) => {
  const records = await db('attendance_records')
    .where({ tenant_id: tenantId, employee_id: employeeId })
    .whereRaw("strftime('%Y', date) = ? AND strftime('%m', date) = ?", [String(year), String(month).padStart(2,'0')])
    .select();

  const present  = records.filter(r => r.status === 'present' || r.status === 'late').length;
  const absent   = records.filter(r => r.status === 'absent').length;
  const late     = records.filter(r => r.status === 'late').length;
  const on_leave = records.filter(r => r.status === 'on_leave').length;
  const totalWorked  = records.reduce((s, r) => s + (r.worked_minutes || 0), 0);
  const totalOvertime= records.reduce((s, r) => s + (r.overtime_minutes || 0), 0);

  return { year, month, present, absent, late, on_leave, total_worked_minutes: totalWorked, total_overtime_minutes: totalOvertime, records };
};

const exportRecords = async (tenantId, query, format='xlsx') => {
  const { data } = await listRecords(tenantId, { ...query, per_page:10000, page:1 });
  const cols = [
    {key:'employee_number',label:'Emp #'},{key:'first_name',label:'First'},{key:'last_name',label:'Last'},
    {key:'date',label:'Date'},{key:'clock_in_at',label:'Clock In'},{key:'clock_out_at',label:'Clock Out'},
    {key:'worked_minutes',label:'Worked (min)'},{key:'overtime_minutes',label:'OT (min)'},{key:'status',label:'Status'},
  ];
  if (format==='csv') return toCsv(cols, data);
  if (format==='pdf') return toPdf('Attendance Records', cols, data);
  return toExcel(cols, data, 'Attendance');
};

module.exports = { getPolicy, upsertPolicy, clockIn, clockOut, listRecords, manualEdit, monthlySummary, exportRecords };
