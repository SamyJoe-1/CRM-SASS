const { v4: uuidv4 } = require('uuid');
const db = require('../../config/database');
const { NotFoundError, BusinessError } = require('../../utils/AppError');
const { getPagination, buildMeta } = require('../../utils/pagination');
const notifSvc = require('../notifications/notifications.service');

const list = async (tenantId, query) => {
  const { page, per_page, offset } = getPagination(query);
  const base = () => db('announcements').where({ tenant_id:tenantId, deleted_at:null });
  let q = base().orderBy('created_at','desc');
  if (query.status) q.where('status', query.status);
  const [{ count }] = await base().count('id as count');
  const data = await q.limit(per_page).offset(offset);
  return { data, meta: buildMeta(page, per_page, Number(count)) };
};

const getById = async (tenantId, id) => {
  const a = await db('announcements').where({ id, tenant_id:tenantId, deleted_at:null }).first();
  if (!a) throw new NotFoundError('Announcement not found');
  return a;
};

const create = async (tenantId, userId, data) => {
  const now=new Date().toISOString(); const id=uuidv4();
  await db('announcements').insert({ id, tenant_id:tenantId, created_by:userId, ...data, status:'draft', created_at:now, updated_at:now });
  return getById(tenantId, id);
};

const update = async (tenantId, id, data) => {
  const a = await getById(tenantId, id);
  if (a.status === 'published') throw new BusinessError('Published announcements cannot be edited');
  await db('announcements').where({ id }).update({ ...data, updated_at:new Date().toISOString() });
  return getById(tenantId, id);
};

const publish = async (tenantId, id) => {
  const a = await getById(tenantId, id);
  if (a.status === 'published') throw new BusinessError('Already published');
  const now = new Date().toISOString();
  await db('announcements').where({ id }).update({ status:'published', published_at:now, updated_at:now });

  // broadcast notification to all tenant users
  const users = await db('users').where({ tenant_id:tenantId, is_active:true, deleted_at:null }).select('id');
  for (const u of users) {
    await notifSvc.createNotification(tenantId, {
      user_id:u.id, type:'announcement',
      title: a.title,
      body:  a.body ? a.body.substring(0,120) : '',
      data_json: JSON.stringify({ announcement_id: id }),
    });
  }
  return getById(tenantId, id);
};

const remove = async (tenantId, id) => {
  await getById(tenantId, id);
  await db('announcements').where({ id }).update({ deleted_at:new Date().toISOString() });
};

module.exports = { list, getById, create, update, publish, remove };
