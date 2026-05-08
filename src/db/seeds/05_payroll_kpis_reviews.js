const { v4: uuidv4 } = require('uuid');
const now = new Date().toISOString();

exports.seed = async (knex) => {
  const tenantId = 'tenant-demo-0001';
  const hrUser   = await knex('users').where({ tenant_id: tenantId, role_name: 'hr_manager' }).first();
  const employees= await knex('employees').where({ tenant_id: tenantId }).select('id');
  const today    = new Date();
  const year     = today.getFullYear();
  const month    = today.getMonth() + 1;

  // Payroll cycle (draft)
  const cycleId = uuidv4();
  await knex('payroll_cycles').where({ tenant_id: tenantId }).del();
  await knex('payroll_cycles').insert({
    id: cycleId, tenant_id: tenantId, year, month, status: 'draft',
    created_at: now, updated_at: now,
  });

  // KPIs
  const deptEng = await knex('departments').where({ tenant_id: tenantId, name: 'Engineering' }).first();
  await knex('kpis').where({ tenant_id: tenantId }).del();
  await knex('kpis').insert([
    {
      id: uuidv4(), tenant_id: tenantId,
      employee_id: employees[0]?.id || null,
      created_by: hrUser?.id,
      title: 'Sprint Velocity', unit: 'number',
      target_value: 40, current_value: 32,
      period: `Q${Math.ceil(month/3)} ${year}`,
      start_date: `${year}-01-01`, end_date: `${year}-03-31`,
      scope: 'employee', status: 'in_progress',
      created_at: now, updated_at: now,
    },
    {
      id: uuidv4(), tenant_id: tenantId,
      department_id: deptEng?.id || null,
      created_by: hrUser?.id,
      title: 'Code Review Coverage', unit: 'percentage',
      target_value: 90, current_value: 75,
      period: `Q${Math.ceil(month/3)} ${year}`,
      start_date: `${year}-01-01`, end_date: `${year}-03-31`,
      scope: 'department', status: 'in_progress',
      created_at: now, updated_at: now,
    },
  ]);

  // Performance review
  await knex('performance_reviews').where({ tenant_id: tenantId }).del();
  if (employees.length && hrUser) {
    await knex('performance_reviews').insert({
      id: uuidv4(), tenant_id: tenantId,
      employee_id: employees[0].id,
      reviewer_id: hrUser.id,
      period_label: `H1 ${year}`,
      period_start: `${year}-01-01`,
      period_end:   `${year}-06-30`,
      criteria_json: JSON.stringify([
        { label:'Technical Skills', score:8, weight:0.4 },
        { label:'Communication',    score:7, weight:0.3 },
        { label:'Teamwork',         score:9, weight:0.3 },
      ]),
      overall_score: 8.0,
      comments: 'Strong performer with consistent delivery.',
      status: 'draft',
      created_at: now, updated_at: now,
    });
  }

  // Announcement
  await knex('announcements').where({ tenant_id: tenantId }).del();
  if (hrUser) {
    await knex('announcements').insert({
      id: uuidv4(), tenant_id: tenantId, created_by: hrUser.id,
      title: 'Welcome to the CRM Platform!',
      title_ar: 'مرحباً بكم في منصة إدارة علاقات العملاء!',
      body: 'We are excited to launch our new HR & CRM platform. Please explore all features.',
      body_ar: 'يسعدنا إطلاق منصتنا الجديدة. يرجى استكشاف جميع الميزات.',
      status: 'published', published_at: now, audience: 'all',
      created_at: now, updated_at: now,
    });
  }
};
