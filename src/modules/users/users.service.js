const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../../config/database');
const { NotFoundError, ConflictError } = require('../../utils/AppError');
const { getPagination, buildMeta } = require('../../utils/pagination');

const list = async (tenantId, query) => {
  const { page, per_page, offset } = getPagination(query);
  const base = () => db('users').where({ tenant_id:tenantId, deleted_at:null });
  let q = base().leftJoin('roles','roles.id','users.role_id')
    .select('users.id','users.email','users.first_name','users.last_name','users.role_name','users.is_active','users.created_at','roles.display_name as role_display');
  if (query.search) q.where(b=>b.orWhere('users.first_name','like',`%${query.search}%`).orWhere('users.email','like',`%${query.search}%`));
  const [{ count }] = await base().count('users.id as count');
  const data = await q.limit(per_page).offset(offset);
  return { data, meta: buildMeta(page, per_page, Number(count)) };
};

const getById = async (tenantId, id) => {
  const u = await db('users').where({ id, tenant_id:tenantId, deleted_at:null })
    .leftJoin('roles','roles.id','users.role_id')
    .select('users.id','users.email','users.first_name','users.last_name','users.role_name','users.is_active','users.created_at','roles.display_name as role_display')
    .first();
  if (!u) throw new NotFoundError('User not found');
  return u;
};

const create = async (tenantId, data) => {
  const exists = await db('users').where({ tenant_id:tenantId, email:data.email.toLowerCase(), deleted_at:null }).first();
  if (exists) throw new ConflictError('Email already in use');
  const now  = new Date().toISOString();
  const id   = uuidv4();
  const hash = await bcrypt.hash(data.password, 12);
  const role = await db('roles').where({ id:data.role_id }).first();
  await db('users').insert({ id, tenant_id:tenantId, ...data, email:data.email.toLowerCase(), password_hash:hash, role_name:role?.name||'employee', is_active:true, created_at:now, updated_at:now });
  return getById(tenantId, id);
};

const update = async (tenantId, id, data) => {
  await getById(tenantId, id);
  const payload = { ...data, updated_at:new Date().toISOString() };
  delete payload.password;
  if (data.role_id) {
    const role = await db('roles').where({ id:data.role_id }).first();
    if (role) payload.role_name = role.name;
  }
  await db('users').where({ id, tenant_id:tenantId }).update(payload);
  return getById(tenantId, id);
};

const deactivate = async (tenantId, id) => {
  await getById(tenantId, id);
  await db('users').where({ id, tenant_id:tenantId }).update({ is_active:false, updated_at:new Date().toISOString() });
};

const activate = async (tenantId, id) => {
  await getById(tenantId, id);
  await db('users').where({ id, tenant_id:tenantId }).update({ is_active:true, updated_at:new Date().toISOString() });
};

const resetPassword = async (tenantId, id, newPassword) => {
  await getById(tenantId, id);
  const hash = await bcrypt.hash(newPassword, 12);
  await db('users').where({ id, tenant_id:tenantId }).update({ password_hash:hash, updated_at:new Date().toISOString() });
};

module.exports = { list, getById, create, update, deactivate, activate, resetPassword };
