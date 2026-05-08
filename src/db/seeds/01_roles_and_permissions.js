const { v4: uuidv4 } = require('uuid');
const now = new Date().toISOString();

const PERMISSIONS = [
  // employees
  { module:'employees', action:'view'      },
  { module:'employees', action:'create'    },
  { module:'employees', action:'update'    },
  { module:'employees', action:'delete'    },
  { module:'employees', action:'export'    },
  { module:'employees', action:'terminate' },
  // attendance
  { module:'attendance', action:'view'        },
  { module:'attendance', action:'clock_in'    },
  { module:'attendance', action:'clock_out'   },
  { module:'attendance', action:'edit'        },
  { module:'attendance', action:'export'      },
  { module:'attendance', action:'policy_edit' },
  // leave
  { module:'leave', action:'view'    },
  { module:'leave', action:'request' },
  { module:'leave', action:'approve' },
  { module:'leave', action:'reject'  },
  { module:'leave', action:'types_manage' },
  // payroll
  { module:'payroll', action:'view'    },
  { module:'payroll', action:'process' },
  { module:'payroll', action:'cancel'  },
  { module:'payroll', action:'export'  },
  // payslips
  { module:'payslips', action:'view_all' },
  { module:'payslips', action:'view_own' },
  // performance
  { module:'performance', action:'view'        },
  { module:'performance', action:'create'      },
  { module:'performance', action:'update'      },
  { module:'performance', action:'delete'      },
  { module:'performance', action:'submit'      },
  { module:'performance', action:'acknowledge' },
  // kpis
  { module:'kpis', action:'view'            },
  { module:'kpis', action:'create'          },
  { module:'kpis', action:'update'          },
  { module:'kpis', action:'delete'          },
  { module:'kpis', action:'update_progress' },
  // analytics
  { module:'analytics', action:'view'   },
  { module:'analytics', action:'export' },
  // departments & positions
  { module:'departments', action:'view'   },
  { module:'departments', action:'manage' },
  { module:'positions',   action:'view'   },
  { module:'positions',   action:'manage' },
  // announcements
  { module:'announcements', action:'view'    },
  { module:'announcements', action:'create'  },
  { module:'announcements', action:'publish' },
  { module:'announcements', action:'delete'  },
  // notifications
  { module:'notifications', action:'view' },
  // audit
  { module:'audit', action:'view'   },
  { module:'audit', action:'export' },
  // settings
  { module:'settings', action:'view'   },
  { module:'settings', action:'update' },
  // roles
  { module:'roles', action:'view'   },
  { module:'roles', action:'manage' },
  // users
  { module:'users', action:'view'   },
  { module:'users', action:'manage' },
];

// Which permissions each role gets
const ROLE_PERMS = {
  super_admin:  'ALL',
  hr_manager: [
    'employees:view','employees:create','employees:update','employees:delete','employees:export','employees:terminate',
    'attendance:view','attendance:clock_in','attendance:clock_out','attendance:edit','attendance:export','attendance:policy_edit',
    'leave:view','leave:request','leave:approve','leave:reject','leave:types_manage',
    'payroll:view','payroll:process','payroll:cancel','payroll:export',
    'payslips:view_all','payslips:view_own',
    'performance:view','performance:create','performance:update','performance:delete','performance:submit','performance:acknowledge',
    'kpis:view','kpis:create','kpis:update','kpis:delete','kpis:update_progress',
    'analytics:view','analytics:export',
    'departments:view','departments:manage','positions:view','positions:manage',
    'announcements:view','announcements:create','announcements:publish','announcements:delete',
    'notifications:view',
    'audit:view','audit:export',
    'settings:view','settings:update',
    'roles:view','users:view','users:manage',
  ],
  finance: [
    'employees:view',
    'payroll:view','payroll:process','payroll:cancel','payroll:export',
    'payslips:view_all','payslips:view_own',
    'analytics:view','analytics:export',
    'departments:view','positions:view',
    'notifications:view',
    'settings:view',
  ],
  employee: [
    'attendance:view','attendance:clock_in','attendance:clock_out',
    'leave:view','leave:request',
    'payslips:view_own',
    'performance:view','performance:acknowledge',
    'kpis:view','kpis:update_progress',
    'announcements:view',
    'notifications:view',
  ],
};

exports.seed = async (knex) => {
  await knex('role_permissions').del();
  await knex('permissions').del();
  await knex('roles').whereNull('tenant_id').del();

  // insert permissions
  const permRows = PERMISSIONS.map((p) => ({
    id:          uuidv4(),
    key:         `${p.module}:${p.action}`,
    module:      p.module,
    action:      p.action,
    description: `${p.action} on ${p.module}`,
    created_at:  now,
    updated_at:  now,
  }));
  await knex('permissions').insert(permRows);

  const permMap = {};
  permRows.forEach((p) => { permMap[p.key] = p.id; });

  // system roles (no tenant)
  const roleNames = ['super_admin','hr_manager','finance','employee'];
  const roleRows  = roleNames.map((name) => ({
    id:           uuidv4(),
    tenant_id:    null,
    name,
    display_name: name.replace('_',' ').replace(/\b\w/g,(c)=>c.toUpperCase()),
    is_system:    true,
    created_at:   now,
    updated_at:   now,
  }));
  await knex('roles').insert(roleRows);

  const roleMap = {};
  roleRows.forEach((r) => { roleMap[r.name] = r.id; });

  // role_permissions
  const rpRows = [];
  for (const [roleName, perms] of Object.entries(ROLE_PERMS)) {
    const roleId  = roleMap[roleName];
    const keys    = perms === 'ALL' ? Object.keys(permMap) : perms;
    for (const key of keys) {
      if (permMap[key]) {
        rpRows.push({ id: uuidv4(), role_id: roleId, permission_id: permMap[key], created_at: now, updated_at: now });
      }
    }
  }
  await knex('role_permissions').insert(rpRows);

  // expose for next seeds
  global.__seedRoleMap = roleMap;
  global.__seedPermMap = permMap;
};
