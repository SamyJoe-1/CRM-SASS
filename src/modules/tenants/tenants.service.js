const { v4: uuidv4 } = require('uuid');
const db = require('../../config/database');
const { NotFoundError, ConflictError } = require('../../utils/AppError');
const { getPagination, buildMeta } = require('../../utils/pagination');

const list = async (query) => {
  const { page, per_page, offset } = getPagination(query);
  const base = () => db('tenants').where({ deleted_at:null });
  if (query.search) base().where(b=>b.orWhere('name','like',`%${query.search}%`).orWhere('slug','like',`%${query.search}%`));
  const data = await base().orderBy('created_at','desc').limit(per_page).offset(offset);
  const [{ count }] = await db('tenants').where({ deleted_at:null }).count('id as count');
  return { data, meta: buildMeta(page,per_page,Number(count)) };
};

const getById = async (id) => {
  const t = await db('tenants').where({ id, deleted_at:null }).first();
  if (!t) throw new NotFoundError('Tenant not found');
  return t;
};

const create = async (data) => {
  const existing = await db('tenants').where({ slug:data.slug }).first();
  if (existing) throw new ConflictError('Slug already in use');
  const now=new Date().toISOString(); const id=uuidv4();
  await db('tenants').insert({ id, ...data, is_active:true, created_at:now, updated_at:now });
  // auto-create payroll config
  await db('payroll_configs').insert({ id:uuidv4(), tenant_id:id, insurance_rate:0.11, insurance_cap:50000, working_days_per_month:22, created_at:now, updated_at:now });
  return getById(id);
};

const update = async (id, data) => {
  await getById(id);
  await db('tenants').where({ id }).update({ ...data, updated_at:new Date().toISOString() });
  return getById(id);
};

const deactivate = async (id) => {
  await getById(id);
  await db('tenants').where({ id }).update({ is_active:false, updated_at:new Date().toISOString() });
};

const activate = async (id) => {
  await getById(id);
  await db('tenants').where({ id }).update({ is_active:true, updated_at:new Date().toISOString() });
};

module.exports = { list, getById, create, update, deactivate, activate };
