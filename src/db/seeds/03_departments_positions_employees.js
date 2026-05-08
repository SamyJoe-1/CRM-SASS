const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const now    = new Date().toISOString();

exports.seed = async (knex) => {
  const tenantId = 'tenant-demo-0001';
  const roles    = await knex('roles').whereNull('tenant_id').select('id','name');
  const roleMap  = {};
  roles.forEach((r) => { roleMap[r.name] = r.id; });

  // Departments
  const deptEngId  = uuidv4();
  const deptHrId   = uuidv4();
  await knex('departments').where({ tenant_id: tenantId }).del();
  await knex('departments').insert([
    { id: deptEngId,  tenant_id: tenantId, name: 'Engineering', name_ar: 'الهندسة',        created_at: now, updated_at: now },
    { id: deptHrId,   tenant_id: tenantId, name: 'Human Resources', name_ar: 'الموارد البشرية', created_at: now, updated_at: now },
  ]);

  // Positions
  const posDevId  = uuidv4();
  const posLeadId = uuidv4();
  const posHrId   = uuidv4();
  await knex('positions').where({ tenant_id: tenantId }).del();
  await knex('positions').insert([
    { id: posDevId,  tenant_id: tenantId, department_id: deptEngId, title: 'Software Developer',  title_ar: 'مطور برمجيات',    created_at: now, updated_at: now },
    { id: posLeadId, tenant_id: tenantId, department_id: deptEngId, title: 'Tech Lead',            title_ar: 'قائد تقني',       created_at: now, updated_at: now },
    { id: posHrId,   tenant_id: tenantId, department_id: deptHrId,  title: 'HR Specialist',        title_ar: 'أخصائي موارد بشرية', created_at: now, updated_at: now },
  ]);

  // Employee users + employee records
  const empData = [
    { fn:'Ahmed', ln:'Ali',     fnAr:'أحمد',   lnAr:'علي',      email:'ahmed@demo.com',   salary:8000,  pos:posLeadId,  dept:deptEngId },
    { fn:'Nour',  ln:'Ibrahim', fnAr:'نور',    lnAr:'إبراهيم',  email:'nour@demo.com',    salary:6500,  pos:posDevId,   dept:deptEngId },
    { fn:'Omar',  ln:'Khaled',  fnAr:'عمر',    lnAr:'خالد',     email:'omar@demo.com',    salary:6000,  pos:posDevId,   dept:deptEngId },
    { fn:'Layla', ln:'Mostafa', fnAr:'ليلى',   lnAr:'مصطفى',   email:'layla@demo.com',   salary:5500,  pos:posDevId,   dept:deptEngId },
    { fn:'Yara',  ln:'Salem',   fnAr:'يارا',   lnAr:'سالم',     email:'yara@demo.com',    salary:5000,  pos:posHrId,    dept:deptHrId  },
  ];

  await knex('employees').where({ tenant_id: tenantId }).del();
  const empUserIds = [];
  for (let i = 0; i < empData.length; i++) {
    const d      = empData[i];
    const userId = uuidv4();
    const empId  = uuidv4();
    empUserIds.push({ userId, empId, ...d });

    await knex('users').insert({
      id:            userId,
      tenant_id:     tenantId,
      role_id:       roleMap['employee'],
      role_name:     'employee',
      email:         d.email,
      password_hash: await bcrypt.hash('Employee@123', 12),
      first_name:    d.fn,
      last_name:     d.ln,
      language:      'en',
      is_active:     true,
      created_at:    now,
      updated_at:    now,
    });

    await knex('employees').insert({
      id:              empId,
      tenant_id:       tenantId,
      user_id:         userId,
      department_id:   d.dept,
      position_id:     d.pos,
      employee_number: `EMP-${String(i+1).padStart(4,'0')}`,
      first_name:      d.fn,
      last_name:       d.ln,
      first_name_ar:   d.fnAr,
      last_name_ar:    d.lnAr,
      work_email:      d.email,
      hire_date:       '2023-01-01',
      contract_type:   'full_time',
      base_salary:     d.salary,
      allowances:      500,
      status:          'active',
      created_at:      now,
      updated_at:      now,
    });
  }

  global.__seedEmpUserIds = empUserIds;
  global.__seedDeptEngId  = deptEngId;
  global.__seedDeptHrId   = deptHrId;
};
