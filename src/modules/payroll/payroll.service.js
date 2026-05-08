const { v4: uuidv4 }     = require('uuid');
const db                   = require('../../config/database');
const { calculatePayroll } = require('../../utils/payrollEngine');
const { NotFoundError, BusinessError, ConflictError } = require('../../utils/AppError');
const { getPagination, buildMeta } = require('../../utils/pagination');
const { toExcel, toCsv, toPdf }   = require('../../utils/exportHelper');

const listCycles = async (tenantId, query) => {
  const { page, per_page, offset } = getPagination(query);
  const base = () => db('payroll_cycles').where({ tenant_id: tenantId, deleted_at: null });
  const data = await base().orderBy('year','desc').orderBy('month','desc').limit(per_page).offset(offset);
  const [{ count }] = await base().count('id as count');
  return { data, meta: buildMeta(page, per_page, Number(count)) };
};

const createCycle = async (tenantId, data) => {
  const existing = await db('payroll_cycles').where({ tenant_id: tenantId, year: data.year, month: data.month, deleted_at: null }).first();
  if (existing) throw new ConflictError('Payroll cycle already exists for this month');
  const now = new Date().toISOString();
  const id  = uuidv4();
  await db('payroll_cycles').insert({ id, tenant_id: tenantId, ...data, status:'draft', created_at:now, updated_at:now });
  return db('payroll_cycles').where({ id }).first();
};

const getCycle = async (tenantId, id) => {
  const c = await db('payroll_cycles').where({ id, tenant_id: tenantId, deleted_at: null }).first();
  if (!c) throw new NotFoundError('Payroll cycle not found');
  return c;
};

const deleteCycle = async (tenantId, id) => {
  const c = await getCycle(tenantId, id);
  if (c.status !== 'draft') throw new BusinessError('Only draft cycles can be deleted');
  await db('payroll_cycles').where({ id }).update({ deleted_at: new Date().toISOString() });
};

const generateRecords = async (tenantId, cycleId) => {
  const cycle   = await getCycle(tenantId, cycleId);
  if (cycle.status !== 'draft') throw new BusinessError('Records can only be generated for draft cycles');

  const employees = await db('employees').where({ tenant_id: tenantId, status: 'active', deleted_at: null });
  const config    = await db('payroll_configs').where({ tenant_id: tenantId }).first();

  const now    = new Date().toISOString();
  const rows   = [];

  for (const emp of employees) {
    const existing = await db('payroll_records').where({ cycle_id: cycleId, employee_id: emp.id }).first();
    if (existing) continue;

    const attSummary = await db('attendance_records')
      .where({ tenant_id: tenantId, employee_id: emp.id })
      .whereRaw("strftime('%Y', date) = ? AND strftime('%m', date) = ?", [String(cycle.year), String(cycle.month).padStart(2,'0')])
      .select();

    const workingDays   = config ? config.working_days_per_month : 22;
    const presentDays   = attSummary.filter(r => ['present','late'].includes(r.status)).length;
    const absentDays    = Math.max(0, workingDays - presentDays - attSummary.filter(r=>r.status==='on_leave').length);
    const overtimeMins  = attSummary.reduce((s,r)=>s+(r.overtime_minutes||0),0);

    const result = calculatePayroll({
      employee: emp,
      cycle,
      attendanceSummary: { working_days: workingDays, absent_days: absentDays, overtime_minutes: overtimeMins },
      payrollConfig: config,
    });

    rows.push({ id: uuidv4(), tenant_id: tenantId, cycle_id: cycleId, employee_id: emp.id, ...result, status:'draft', created_at:now, updated_at:now });
  }

  if (rows.length) await db('payroll_records').insert(rows);
  return db('payroll_records').where({ cycle_id: cycleId }).select();
};

const listRecords = async (tenantId, cycleId, query) => {
  const { page, per_page, offset } = getPagination(query);
  const base = () => db('payroll_records').where({ 'payroll_records.tenant_id': tenantId, 'payroll_records.cycle_id': cycleId, 'payroll_records.deleted_at': null });
  let q = base()
    .leftJoin('employees','employees.id','payroll_records.employee_id')
    .select('payroll_records.*','employees.first_name','employees.last_name','employees.employee_number');
  const [{ count }] = await base().count('payroll_records.id as count');
  const data        = await q.limit(per_page).offset(offset);
  return { data, meta: buildMeta(page, per_page, Number(count)) };
};

const editRecord = async (tenantId, cycleId, recordId, data) => {
  const cycle  = await getCycle(tenantId, cycleId);
  if (!['draft','processing'].includes(cycle.status)) throw new BusinessError('Cannot edit records in this cycle state');

  const record = await db('payroll_records').where({ id: recordId, cycle_id: cycleId }).first();
  if (!record) throw new NotFoundError('Payroll record not found');

  const emp    = await db('employees').where({ id: record.employee_id }).first();
  const config = await db('payroll_configs').where({ tenant_id: tenantId }).first();
  const merged = { ...record, ...data };
  const result = calculatePayroll({
    employee: { ...emp, allowances: merged.allowances },
    cycle,
    attendanceSummary: { working_days: record.working_days, absent_days: record.absent_days, overtime_minutes: record.overtime_minutes },
    payrollConfig: { ...config, bonus: data.bonus ?? record.bonus, other_deductions: data.other_deductions ?? record.other_deductions },
  });
  const now = new Date().toISOString();
  await db('payroll_records').where({ id: recordId }).update({ ...result, bonus: data.bonus??record.bonus, other_deductions: data.other_deductions??record.other_deductions, notes: data.notes||record.notes, updated_at:now });
  return db('payroll_records').where({ id: recordId }).first();
};

const processOne = async (tenantId, cycleId, recordId, userId) => {
  const cycle  = await getCycle(tenantId, cycleId);
  if (!['draft','processing'].includes(cycle.status)) throw new BusinessError('Cycle not in processable state');
  const record = await db('payroll_records').where({ id: recordId, cycle_id: cycleId, deleted_at: null }).first();
  if (!record) throw new NotFoundError('Record not found');
  if (record.status === 'processed') throw new ConflictError('Already processed');

  const now = new Date().toISOString();
  await db('payroll_records').where({ id: recordId }).update({ status:'processed', updated_at:now });

  // generate payslip
  const existing = await db('payslips').where({ payroll_record_id: recordId }).first();
  if (!existing) {
    await db('payslips').insert({
      id: uuidv4(), tenant_id: tenantId, payroll_record_id: recordId,
      employee_id: record.employee_id, created_at:now, updated_at:now,
    });
  }

  if (cycle.status === 'draft') {
    await db('payroll_cycles').where({ id: cycleId }).update({ status:'processing', updated_at:now });
  }
  return db('payroll_records').where({ id: recordId }).first();
};

const processAll = async (tenantId, cycleId, userId) => {
  const cycle = await getCycle(tenantId, cycleId);
  if (cycle.status === 'processed') throw new ConflictError('Cycle already fully processed');

  const records = await db('payroll_records').where({ cycle_id: cycleId, deleted_at: null }).whereNot({ status:'processed' });
  for (const r of records) await processOne(tenantId, cycleId, r.id, userId);

  const now = new Date().toISOString();
  await db('payroll_cycles').where({ id: cycleId }).update({ status:'processed', processed_at:now, processed_by:userId, updated_at:now });
  return getCycle(tenantId, cycleId);
};

const cancelOne = async (tenantId, cycleId, recordId) => {
  const record = await db('payroll_records').where({ id:recordId, cycle_id:cycleId }).first();
  if (!record) throw new NotFoundError('Record not found');
  await db('payroll_records').where({ id:recordId }).update({ status:'cancelled', updated_at:new Date().toISOString() });
};

const cancelAll = async (tenantId, cycleId) => {
  const cycle = await getCycle(tenantId, cycleId);
  if (cycle.status === 'cancelled') throw new ConflictError('Already cancelled');
  const now = new Date().toISOString();
  await db('payroll_records').where({ cycle_id:cycleId }).update({ status:'cancelled', updated_at:now });
  await db('payroll_cycles').where({ id:cycleId }).update({ status:'cancelled', updated_at:now });
};

const summary = async (tenantId, cycleId) => {
  const records = await db('payroll_records').where({ cycle_id:cycleId, tenant_id:tenantId, deleted_at:null });
  const sum = (key) => records.reduce((s,r)=>s+(r[key]||0),0);
  return {
    total_employees: records.length,
    total_gross:     Math.round(sum('gross_salary')*100)/100,
    total_net:       Math.round(sum('net_salary')*100)/100,
    total_tax:       Math.round(sum('tax_amount')*100)/100,
    total_insurance: Math.round(sum('insurance_amount')*100)/100,
    total_deductions:Math.round(sum('total_deductions')*100)/100,
  };
};

const exportRecords = async (tenantId, cycleId, format='xlsx') => {
  const { data } = await listRecords(tenantId, cycleId, { per_page:10000, page:1 });
  const cols = [
    {key:'employee_number',label:'Emp #'},{key:'first_name',label:'First'},{key:'last_name',label:'Last'},
    {key:'gross_salary',label:'Gross'},{key:'tax_amount',label:'Tax'},{key:'insurance_amount',label:'Insurance'},
    {key:'absence_deduction',label:'Absence Ded.'},{key:'net_salary',label:'Net'},
  ];
  if (format==='csv') return toCsv(cols,data);
  if (format==='pdf') return toPdf('Payroll Records', cols, data);
  return toExcel(cols, data, 'Payroll');
};

module.exports = { listCycles, createCycle, getCycle, deleteCycle, generateRecords, listRecords, editRecord, processOne, processAll, cancelOne, cancelAll, summary, exportRecords };
