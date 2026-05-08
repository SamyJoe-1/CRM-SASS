const { v4: uuidv4 } = require('uuid');
const db           = require('../../config/database');
const { NotFoundError, ConflictError } = require('../../utils/AppError');
const { getPagination, buildMeta }     = require('../../utils/pagination');
const { applyFilters }                 = require('../../utils/filterBuilder');
const { toExcel, toCsv, toPdf }       = require('../../utils/exportHelper');

const SEARCH_COLS  = ['first_name','last_name','work_email','employee_number','first_name_ar','last_name_ar'];
const ALLOWED_SORT = ['first_name','last_name','hire_date','base_salary','created_at','status'];

const list = async (tenantId, query) => {
  const { page, per_page, offset } = getPagination(query);

  const base = () => db('employees')
    .where({ 'employees.tenant_id': tenantId, 'employees.deleted_at': null });

  let q = base()
    .leftJoin('departments', 'departments.id', 'employees.department_id')
    .leftJoin('positions',   'positions.id',   'employees.position_id')
    .select(
      'employees.*',
      'departments.name as department_name',
      'positions.title  as position_title'
    );

  applyFilters(q, query, { searchColumns: SEARCH_COLS, allowedSortCols: ALLOWED_SORT, tableAlias: 'employees' });

  const [{ count }] = await base().count('employees.id as count');
  const data        = await q.limit(per_page).offset(offset);

  return { data, meta: buildMeta(page, per_page, Number(count)) };
};

const getById = async (tenantId, id) => {
  const emp = await db('employees')
    .where({ 'employees.id': id, 'employees.tenant_id': tenantId, 'employees.deleted_at': null })
    .leftJoin('departments', 'departments.id', 'employees.department_id')
    .leftJoin('positions',   'positions.id',   'employees.position_id')
    .select('employees.*','departments.name as department_name','positions.title as position_title')
    .first();
  if (!emp) throw new NotFoundError('Employee not found');
  return emp;
};

const generateEmployeeNumber = async (tenantId) => {
  const last = await db('employees').where({ tenant_id: tenantId }).orderBy('created_at','desc').first();
  const num  = last ? parseInt(last.employee_number.split('-')[1] || '0', 10) + 1 : 1;
  return `EMP-${String(num).padStart(4,'0')}`;
};

const create = async (tenantId, data) => {
  const now = new Date().toISOString();
  const id  = uuidv4();
  const employee_number = data.employee_number || await generateEmployeeNumber(tenantId);

  const existing = await db('employees').where({ tenant_id: tenantId, employee_number, deleted_at: null }).first();
  if (existing) throw new ConflictError('Employee number already exists');

  await db('employees').insert({ id, tenant_id: tenantId, employee_number, ...data, created_at: now, updated_at: now });
  return getById(tenantId, id);
};

const update = async (tenantId, id, data) => {
  await getById(tenantId, id);
  await db('employees').where({ id, tenant_id: tenantId }).update({ ...data, updated_at: new Date().toISOString() });
  return getById(tenantId, id);
};

const softDelete = async (tenantId, id) => {
  await getById(tenantId, id);
  await db('employees').where({ id, tenant_id: tenantId }).update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() });
};

const terminate = async (tenantId, id, { termination_date, termination_reason }) => {
  const emp = await getById(tenantId, id);
  if (emp.status === 'terminated') throw new ConflictError('Employee already terminated');
  await db('employees').where({ id, tenant_id: tenantId }).update({
    status: 'terminated', termination_date, termination_reason,
    updated_at: new Date().toISOString(),
  });
  return getById(tenantId, id);
};

const uploadDocument = async (tenantId, employeeId, file, userId) => {
  await getById(tenantId, employeeId);
  const now = new Date().toISOString();
  const id  = uuidv4();
  await db('employee_documents').insert({
    id, tenant_id: tenantId, employee_id: employeeId,
    name:       file.originalname,
    file_url:   `/uploads/${file.filename}`,
    file_type:  file.mimetype,
    file_size:  file.size,
    uploaded_by:userId,
    created_at: now, updated_at: now,
  });
  return db('employee_documents').where({ id }).first();
};

const listDocuments = async (tenantId, employeeId) => {
  await getById(tenantId, employeeId);
  return db('employee_documents').where({ tenant_id: tenantId, employee_id: employeeId, deleted_at: null }).orderBy('created_at','desc');
};

const deleteDocument = async (tenantId, employeeId, docId) => {
  await getById(tenantId, employeeId);
  const doc = await db('employee_documents').where({ id: docId, tenant_id: tenantId, employee_id: employeeId }).first();
  if (!doc) throw new NotFoundError('Document not found');
  await db('employee_documents').where({ id: docId }).update({ deleted_at: new Date().toISOString() });
};

const exportEmployees = async (tenantId, query, format = 'xlsx') => {
  const { data } = await list(tenantId, { ...query, per_page: 10000, page: 1 });
  const columns  = [
    { key:'employee_number', label:'Employee #'   },
    { key:'first_name',      label:'First Name'   },
    { key:'last_name',       label:'Last Name'    },
    { key:'work_email',      label:'Email'        },
    { key:'department_name', label:'Department'   },
    { key:'position_title',  label:'Position'     },
    { key:'hire_date',       label:'Hire Date'    },
    { key:'base_salary',     label:'Base Salary'  },
    { key:'status',          label:'Status'       },
  ];
  if (format === 'csv')  return toCsv(columns, data);
  if (format === 'pdf')  return toPdf('Employees Report', columns, data);
  return toExcel(columns, data, 'Employees');
};

module.exports = { list, getById, create, update, softDelete, terminate, uploadDocument, listDocuments, deleteDocument, exportEmployees };
