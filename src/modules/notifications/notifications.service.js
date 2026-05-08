const { v4: uuidv4 } = require('uuid');
const db = require('../../config/database');
const { getPagination, buildMeta } = require('../../utils/pagination');

const createNotification = async (tenantId, { user_id, type, title, body, data_json }) => {
  const now = new Date().toISOString();
  await db('notifications').insert({
    id: uuidv4(), tenant_id:tenantId, user_id, type, title, body:body||'',
    data_json: data_json||null, is_read:false, created_at:now, updated_at:now,
  });
};

const list = async (tenantId, userId, query) => {
  const { page, per_page, offset } = getPagination(query);
  const base = () => db('notifications').where({ tenant_id:tenantId, user_id:userId });
  const data = await base().orderBy('created_at','desc').limit(per_page).offset(offset);
  const [{ count }] = await base().count('id as count');
  const [{ unread }] = await base().where({ is_read:false }).count('id as unread');
  return { data, meta: { ...buildMeta(page,per_page,Number(count)), unread_count:Number(unread) } };
};

const markRead = async (tenantId, userId, id) => {
  const now=new Date().toISOString();
  await db('notifications').where({ id, tenant_id:tenantId, user_id:userId }).update({ is_read:true, read_at:now, updated_at:now });
};

const markAllRead = async (tenantId, userId) => {
  const now=new Date().toISOString();
  await db('notifications').where({ tenant_id:tenantId, user_id:userId, is_read:false }).update({ is_read:true, read_at:now, updated_at:now });
};

const unreadCount = async (tenantId, userId) => {
  const [{ count }] = await db('notifications').where({ tenant_id:tenantId, user_id:userId, is_read:false }).count('id as count');
  return { unread_count: Number(count) };
};

module.exports = { createNotification, list, markRead, markAllRead, unreadCount };
