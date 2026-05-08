const db = require('../../config/database');
const { NotFoundError } = require('../../utils/AppError');

const getTenant = async (tenantId) => {
  const t = await db('tenants').where({ id:tenantId }).first();
  if (!t) throw new NotFoundError('Tenant not found');
  const { ...safe } = t;
  return safe;
};

const updateTenant = async (tenantId, data) => {
  const allowed = ['name','language','timezone','logo_url','address','phone','email'];
  const update  = {};
  allowed.forEach(k => { if (data[k] !== undefined) update[k] = data[k]; });
  await db('tenants').where({ id:tenantId }).update({ ...update, updated_at:new Date().toISOString() });
  return getTenant(tenantId);
};

const getPayrollConfig = async (tenantId) => {
  const c = await db('payroll_configs').where({ tenant_id:tenantId }).first();
  if (!c) throw new NotFoundError('Payroll config not found');
  return c;
};

const updatePayrollConfig = async (tenantId, data) => {
  const now = new Date().toISOString();
  const existing = await db('payroll_configs').where({ tenant_id:tenantId }).first();
  if (existing) {
    await db('payroll_configs').where({ tenant_id:tenantId }).update({ ...data, updated_at:now });
  } else {
    const { v4: uuidv4 } = require('uuid');
    await db('payroll_configs').insert({ id:uuidv4(), tenant_id:tenantId, ...data, created_at:now, updated_at:now });
  }
  return getPayrollConfig(tenantId);
};

const listRoles = async (tenantId) =>
  db('roles').where(function(){ this.whereNull('tenant_id').orWhere('tenant_id', tenantId); }).orderBy('name');

const listUsers = async (tenantId) =>
  db('users').where({ tenant_id:tenantId, deleted_at:null })
    .leftJoin('roles','roles.id','users.role_id')
    .select('users.id','users.email','users.first_name','users.last_name','users.role_name','users.is_active','users.created_at','roles.display_name as role_display');

module.exports = { getTenant, updateTenant, getPayrollConfig, updatePayrollConfig, listRoles, listUsers };
