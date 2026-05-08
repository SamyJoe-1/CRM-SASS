const { v4: uuidv4 } = require('uuid');
const db = require('../../config/database');
const { NotFoundError } = require('../../utils/AppError');

const list = (tenantId) => db('positions').where({ tenant_id:tenantId, deleted_at:null }).orderBy('title');
const getById = async (tenantId, id) => {
  const p = await db('positions').where({ id, tenant_id:tenantId, deleted_at:null }).first();
  if (!p) throw new NotFoundError('Position not found');
  return p;
};
const create = async (tenantId, data) => {
  const now=new Date().toISOString(); const id=uuidv4();
  await db('positions').insert({ id, tenant_id:tenantId, ...data, created_at:now, updated_at:now });
  return getById(tenantId, id);
};
const update = async (tenantId, id, data) => {
  await getById(tenantId, id);
  await db('positions').where({ id }).update({ ...data, updated_at:new Date().toISOString() });
  return getById(tenantId, id);
};
const remove = async (tenantId, id) => {
  await getById(tenantId, id);
  await db('positions').where({ id }).update({ deleted_at:new Date().toISOString() });
};
module.exports = { list, getById, create, update, remove };
