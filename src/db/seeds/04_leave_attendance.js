const { v4: uuidv4 } = require('uuid');
const { DateTime }    = require('luxon');
const now             = new Date().toISOString();

exports.seed = async (knex) => {
  const tenantId = 'tenant-demo-0001';

  // Leave types
  const ltAnnualId = uuidv4();
  const ltSickId   = uuidv4();
  await knex('leave_types').where({ tenant_id: tenantId }).del();
  await knex('leave_types').insert([
    { id: ltAnnualId, tenant_id: tenantId, name: 'Annual Leave',  name_ar: 'إجازة سنوية',    default_days: 21, is_paid: true,  requires_approval: true,  created_at: now, updated_at: now },
    { id: ltSickId,   tenant_id: tenantId, name: 'Sick Leave',    name_ar: 'إجازة مرضية',    default_days: 14, is_paid: true,  requires_approval: true,  created_at: now, updated_at: now },
  ]);

  const employees = await knex('employees').where({ tenant_id: tenantId }).select('id');
  const year      = new Date().getFullYear();

  await knex('leave_balances').where({ tenant_id: tenantId }).del();
  const balRows = [];
  for (const emp of employees) {
    balRows.push({ id: uuidv4(), tenant_id: tenantId, employee_id: emp.id, leave_type_id: ltAnnualId, year, total_days: 21, used_days: 0, pending_days: 0, created_at: now, updated_at: now });
    balRows.push({ id: uuidv4(), tenant_id: tenantId, employee_id: emp.id, leave_type_id: ltSickId,   year, total_days: 14, used_days: 0, pending_days: 0, created_at: now, updated_at: now });
  }
  await knex('leave_balances').insert(balRows);

  // Attendance policy
  await knex('attendance_policies').where({ tenant_id: tenantId }).del();
  await knex('attendance_policies').insert({
    id:                   uuidv4(),
    tenant_id:            tenantId,
    work_start_time:      '09:00',
    work_end_time:        '18:00',
    grace_minutes:        15,
    working_days_per_week:5,
    working_days_json:    JSON.stringify([1,2,3,4,5]),
    enforce_network_check:false,
    created_at:           now,
    updated_at:           now,
  });

  // 30 days attendance for current month for all employees
  const today   = DateTime.now();
  const start   = today.startOf('month');
  const attRows = [];

  for (const emp of employees) {
    for (let d = 0; d < 30; d++) {
      const day  = start.plus({ days: d });
      if (day > today) break;
      const dow  = day.weekday; // 1=Mon..7=Sun
      if (dow >= 6) continue;  // skip weekends
      const dateStr = day.toISODate();
      const inAt    = day.set({ hour: 9, minute: Math.floor(Math.random()*20) }).toISO();
      const outAt   = day.set({ hour:18, minute: Math.floor(Math.random()*30) }).toISO();
      const worked  = 8 * 60 + Math.floor(Math.random()*30);
      attRows.push({
        id:              uuidv4(),
        tenant_id:       tenantId,
        employee_id:     emp.id,
        date:            dateStr,
        clock_in_at:     inAt,
        clock_out_at:    outAt,
        worked_minutes:  worked,
        overtime_minutes:Math.max(0, worked - 480),
        late_minutes:    0,
        status:          'present',
        created_at:      now,
        updated_at:      now,
      });
    }
  }
  if (attRows.length) await knex('attendance_records').insert(attRows);
};
