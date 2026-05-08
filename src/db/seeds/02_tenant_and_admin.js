const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const now    = new Date().toISOString();

exports.seed = async (knex) => {
  // load role map
  const roles = await knex('roles').whereNull('tenant_id').select('id','name');
  const roleMap = {};
  roles.forEach((r) => { roleMap[r.name] = r.id; });

  // Demo tenant
  const tenantId = 'tenant-demo-0001';
  await knex('tenants').where({ id: tenantId }).del();
  await knex('tenants').insert({
    id:         tenantId,
    name:       'Demo Company LLC',
    slug:       'demo-company',
    language:   'en',
    timezone:   'Africa/Cairo',
    email:      'info@demo.com',
    phone:      '+201000000000',
    address:    '10 Tahrir Square, Cairo, Egypt',
    is_active:  true,
    created_at: now,
    updated_at: now,
  });

  // payroll config
  await knex('payroll_configs').where({ tenant_id: tenantId }).del();
  await knex('payroll_configs').insert({
    id:                     uuidv4(),
    tenant_id:              tenantId,
    insurance_rate:         0.11,
    insurance_cap:          50000,
    working_days_per_month: 22,
    created_at:             now,
    updated_at:             now,
  });

  // Super admin (platform-level, no tenant)
  const superAdminId = 'user-super-admin-001';
  await knex('users').where({ id: superAdminId }).del();
  await knex('users').insert({
    id:            superAdminId,
    tenant_id:     null,
    role_id:       roleMap['super_admin'],
    role_name:     'super_admin',
    email:         'admin@platform.com',
    password_hash: await bcrypt.hash('Admin@123', 12),
    first_name:    'Super',
    last_name:     'Admin',
    language:      'en',
    is_active:     true,
    created_at:    now,
    updated_at:    now,
  });

  // HR Manager
  const hrId = uuidv4();
  await knex('users').insert({
    id:            hrId,
    tenant_id:     tenantId,
    role_id:       roleMap['hr_manager'],
    role_name:     'hr_manager',
    email:         'hr@demo.com',
    password_hash: await bcrypt.hash('Hr@123456', 12),
    first_name:    'Sara',
    last_name:     'Hassan',
    language:      'en',
    is_active:     true,
    created_at:    now,
    updated_at:    now,
  });

  // Finance user
  const financeId = uuidv4();
  await knex('users').insert({
    id:            financeId,
    tenant_id:     tenantId,
    role_id:       roleMap['finance'],
    role_name:     'finance',
    email:         'finance@demo.com',
    password_hash: await bcrypt.hash('Finance@123', 12),
    first_name:    'Karim',
    last_name:     'Mansour',
    language:      'en',
    is_active:     true,
    created_at:    now,
    updated_at:    now,
  });

  global.__seedTenantId  = tenantId;
  global.__seedHrId      = hrId;
  global.__seedFinanceId = financeId;
};
