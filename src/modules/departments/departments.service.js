const { v4: uuidv4 } = require('uuid');
const db = require('../../config/database');
const { NotFoundError, ConflictError } = require('../../utils/AppError');

const list = (tenantId) => db('departments').where({ tenant_id:tenantId, deleted_at:null }).orderBy('name');
const getById = async (tenantId, id) => {
  const d = await db('departments').where({ id, tenant_id:tenantId, deleted_at:null }).first();
  if (!d) throw new NotFoundError('Department not found');
  return d;
};
const create = async (tenantId, data) => {
  const now=new Date().toISOString(); const id=uuidv4();
  await db('departments').insert({ id, tenant_id:tenantId, ...data, created_at:now, updated_at:now });
  return getById(tenantId, id);
};
const update = async (tenantId, id, data) => {
  await getById(tenantId, id);
  await db('departments').where({ id, tenant_id:tenantId }).update({ ...data, updated_at:new Date().toISOString() });
  return getById(tenantId, id);
};
const remove = async (tenantId, id) => {
  await getById(tenantId, id);
  await db('departments').where({ id }).update({ deleted_at:new Date().toISOString() });
};
module.exports = { list, getById, create, update, remove };
