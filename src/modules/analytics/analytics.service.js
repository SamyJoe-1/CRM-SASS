const db = require('../../config/database');
const { toExcel, toCsv, toPdf } = require('../../utils/exportHelper');

const buildDateFilter = (qb, table, query) => {
  if (query.date_from) qb.where(`${table}.created_at`, '>=', query.date_from);
  if (query.date_to)   qb.where(`${table}.created_at`, '<=', query.date_to + ' 23:59:59');
  if (query.department_id) qb.where(`${table}.department_id`, query.department_id).catch(()=>{});
  if (query.employee_id)   qb.where(`${table}.employee_id`,   query.employee_id).catch(()=>{});
};

const overview = async (tenantId) => {
  const [empCount]   = await db('employees').where({ tenant_id:tenantId, status:'active', deleted_at:null }).count('id as c');
  const [deptCount]  = await db('departments').where({ tenant_id:tenantId, deleted_at:null }).count('id as c');
  const [leaveCount] = await db('leave_requests').where({ tenant_id:tenantId, status:'pending' }).count('id as c');
  const [openKpis]   = await db('kpis').where({ tenant_id:tenantId, status:'in_progress', deleted_at:null }).count('id as c');

  const cycle = await db('payroll_cycles').where({ tenant_id:tenantId }).orderBy('year','desc').orderBy('month','desc').first();
  let totalNet = 0;
  if (cycle) {
    const [sum] = await db('payroll_records').where({ cycle_id:cycle.id, status:'processed' }).sum('net_salary as s');
    totalNet = sum.s || 0;
  }

  return {
    active_employees:    Number(empCount.c),
    departments:         Number(deptCount.c),
    pending_leaves:      Number(leaveCount.c),
    open_kpis:           Number(openKpis.c),
    last_payroll_total:  Math.round(totalNet * 100) / 100,
  };
};

const attendanceTrends = async (tenantId, query) => {
  const rows = await db('attendance_records')
    .where({ tenant_id: tenantId, deleted_at: null })
    .modify(qb => {
      if (query.date_from) qb.where('date', '>=', query.date_from);
      if (query.date_to)   qb.where('date', '<=', query.date_to);
      if (query.employee_id) qb.where('employee_id', query.employee_id);
    })
    .select('date','status')
    .orderBy('date');

  const grouped = {};
  rows.forEach(r => {
    if (!grouped[r.date]) grouped[r.date] = { date:r.date, present:0, absent:0, late:0, on_leave:0 };
    const s = r.status;
    if (['present','late'].includes(s)) grouped[r.date].present++;
    if (s==='absent')   grouped[r.date].absent++;
    if (s==='late')     grouped[r.date].late++;
    if (s==='on_leave') grouped[r.date].on_leave++;
  });
  return Object.values(grouped);
};

const payrollTrends = async (tenantId, query) => {
  const cycles = await db('payroll_cycles').where({ tenant_id:tenantId }).orderBy('year').orderBy('month');
  const result = [];
  for (const c of cycles) {
    const [{ gross, net, emp }] = await db('payroll_records')
      .where({ cycle_id:c.id, status:'processed' })
      .select(db.raw('SUM(gross_salary) as gross, SUM(net_salary) as net, COUNT(*) as emp'));
    result.push({ year:c.year, month:c.month, total_gross:gross||0, total_net:net||0, employee_count:emp||0 });
  }
  return result;
};

const leaveUsage = async (tenantId, query) => {
  const rows = await db('leave_requests')
    .where({ tenant_id:tenantId, status:'approved' })
    .modify(qb => {
      if (query.date_from) qb.where('start_date','>=',query.date_from);
      if (query.date_to)   qb.where('end_date',  '<=',query.date_to);
      if (query.department_id) qb.whereExists(
        db('employees').where('employees.id',db.ref('leave_requests.employee_id')).where('employees.department_id',query.department_id).select(1)
      );
    })
    .leftJoin('leave_types','leave_types.id','leave_requests.leave_type_id')
    .select('leave_types.name as leave_type','leave_requests.days_requested')
    .orderBy('leave_types.name');

  const grouped = {};
  rows.forEach(r => {
    if (!grouped[r.leave_type]) grouped[r.leave_type] = { leave_type:r.leave_type, total_days:0, count:0 };
    grouped[r.leave_type].total_days += r.days_requested;
    grouped[r.leave_type].count++;
  });
  return Object.values(grouped);
};

const performanceAverages = async (tenantId, query) => {
  const rows = await db('performance_reviews')
    .where({ tenant_id:tenantId, deleted_at:null })
    .whereNot({ status:'draft' })
    .modify(qb => {
      if (query.employee_id) qb.where('employee_id', query.employee_id);
    })
    .select('overall_score','period_label');
  if (!rows.length) return { avg:0, count:0, by_period:[] };
  const grouped = {};
  rows.forEach(r => {
    if (!grouped[r.period_label]) grouped[r.period_label] = { period:r.period_label, scores:[] };
    grouped[r.period_label].scores.push(r.overall_score);
  });
  return {
    avg:    Math.round(rows.reduce((s,r)=>s+r.overall_score,0)/rows.length*100)/100,
    count:  rows.length,
    by_period: Object.values(grouped).map(g=>({ period:g.period, avg: Math.round(g.scores.reduce((s,x)=>s+x,0)/g.scores.length*100)/100 })),
  };
};

const kpiAchievement = async (tenantId) => {
  const rows = await db('kpis').where({ tenant_id:tenantId, deleted_at:null });
  const total    = rows.length;
  const achieved = rows.filter(k=>k.status==='achieved').length;
  return {
    total,
    achieved,
    in_progress: rows.filter(k=>k.status==='in_progress').length,
    achievement_rate: total ? Math.round(achieved/total*100) : 0,
  };
};

const headcount = async (tenantId, query) => {
  const rows = await db('employees').where({ tenant_id:tenantId, deleted_at:null })
    .modify(qb => {
      if (query.date_from) qb.where('hire_date','>=',query.date_from);
      if (query.date_to)   qb.where('hire_date','<=',query.date_to);
    })
    .select('hire_date','status')
    .orderBy('hire_date');
  return rows;
};

const exportReport = async (tenantId, { report_type, filters, format }) => {
  let data=[], columns=[], title='Report';
  if (report_type==='attendance') {
    data    = await attendanceTrends(tenantId, filters||{});
    columns = [{key:'date',label:'Date'},{key:'present',label:'Present'},{key:'absent',label:'Absent'},{key:'late',label:'Late'},{key:'on_leave',label:'On Leave'}];
    title   = 'Attendance Trends';
  } else if (report_type==='payroll') {
    data    = await payrollTrends(tenantId, filters||{});
    columns = [{key:'year',label:'Year'},{key:'month',label:'Month'},{key:'total_gross',label:'Gross'},{key:'total_net',label:'Net'},{key:'employee_count',label:'Employees'}];
    title   = 'Payroll Trends';
  } else if (report_type==='leave') {
    data    = await leaveUsage(tenantId, filters||{});
    columns = [{key:'leave_type',label:'Type'},{key:'total_days',label:'Days'},{key:'count',label:'Requests'}];
    title   = 'Leave Usage';
  } else if (report_type==='kpi') {
    const kpis = await db('kpis').where({ tenant_id:tenantId, deleted_at:null });
    data    = kpis;
    columns = [{key:'title',label:'KPI'},{key:'unit',label:'Unit'},{key:'target_value',label:'Target'},{key:'current_value',label:'Current'},{key:'status',label:'Status'}];
    title   = 'KPI Report';
  }
  if (format==='csv')  return { filePath: await toCsv(columns, data), format:'csv' };
  if (format==='pdf')  return { filePath: await toPdf(title, columns, data), format:'pdf' };
  return { filePath: await toExcel(columns, data, title), format:'xlsx' };
};

module.exports = { overview, attendanceTrends, payrollTrends, leaveUsage, performanceAverages, kpiAchievement, headcount, exportReport };
