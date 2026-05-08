const { v4: uuidv4 } = require('uuid');
const db             = require('../../config/database');
const { NotFoundError, BusinessError } = require('../../utils/AppError');
const { getPagination, buildMeta } = require('../../utils/pagination');
const notifSvc = require('../notifications/notifications.service');

const calcOverallScore = (criteria) => {
  const totalWeight = criteria.reduce((s,c)=>s+c.weight,0);
  if (totalWeight===0) return 0;
  return Math.round(criteria.reduce((s,c)=>s+(c.score*c.weight),0)/totalWeight*100)/100;
};

const list = async (tenantId, query) => {
  const { page, per_page, offset } = getPagination(query);
  const base = () => db('performance_reviews').where({ 'performance_reviews.tenant_id':tenantId, 'performance_reviews.deleted_at':null });
  let q = base()
    .leftJoin('employees','employees.id','performance_reviews.employee_id')
    .select('performance_reviews.*','employees.first_name','employees.last_name');
  if (query.employee_id) q.where('performance_reviews.employee_id', query.employee_id);
  if (query.status)      q.where('performance_reviews.status', query.status);
  q.orderBy('performance_reviews.created_at','desc');
  const [{ count }] = await base().count('performance_reviews.id as count');
  const data        = await q.limit(per_page).offset(offset);
  return { data, meta: buildMeta(page, per_page, Number(count)) };
};

const getById = async (tenantId, id) => {
  const r = await db('performance_reviews')
    .where({ 'performance_reviews.id':id, 'performance_reviews.tenant_id':tenantId, 'performance_reviews.deleted_at':null })
    .leftJoin('employees','employees.id','performance_reviews.employee_id')
    .select('performance_reviews.*','employees.first_name','employees.last_name')
    .first();
  if (!r) throw new NotFoundError('Review not found');
  return r;
};

const create = async (tenantId, reviewerId, data) => {
  const { criteria, ...rest } = data;
  const now          = new Date().toISOString();
  const overall_score= calcOverallScore(criteria);
  const id           = uuidv4();
  await db('performance_reviews').insert({
    id, tenant_id:tenantId, reviewer_id:reviewerId,
    ...rest, criteria_json: JSON.stringify(criteria),
    overall_score, status:'draft', created_at:now, updated_at:now,
  });
  return getById(tenantId, id);
};

const update = async (tenantId, id, data) => {
  const rev = await getById(tenantId, id);
  if (rev.status !== 'draft') throw new BusinessError('Only draft reviews can be updated');
  const { criteria, ...rest } = data;
  const payload = { ...rest, updated_at:new Date().toISOString() };
  if (criteria) {
    payload.criteria_json  = JSON.stringify(criteria);
    payload.overall_score  = calcOverallScore(criteria);
  }
  await db('performance_reviews').where({ id }).update(payload);
  return getById(tenantId, id);
};

const remove = async (tenantId, id) => {
  const rev = await getById(tenantId, id);
  if (rev.status !== 'draft') throw new BusinessError('Only draft reviews can be deleted');
  await db('performance_reviews').where({ id }).update({ deleted_at:new Date().toISOString() });
};

const submit = async (tenantId, id) => {
  const rev = await getById(tenantId, id);
  if (rev.status !== 'draft') throw new BusinessError('Only draft reviews can be submitted');
  const now = new Date().toISOString();
  await db('performance_reviews').where({ id }).update({ status:'submitted', submitted_at:now, updated_at:now });

  const emp = await db('employees').where({ id:rev.employee_id }).first();
  if (emp && emp.user_id) {
    await notifSvc.createNotification(tenantId, {
      user_id:emp.user_id, type:'performance_review_submitted',
      title:'New Performance Review',
      body:`Your performance review for ${rev.period_label} has been submitted for your acknowledgement.`,
    });
  }
  return getById(tenantId, id);
};

const acknowledge = async (tenantId, id, userId) => {
  const rev = await getById(tenantId, id);
  if (rev.status !== 'submitted') throw new BusinessError('Review must be in submitted status');
  const now = new Date().toISOString();
  await db('performance_reviews').where({ id }).update({ status:'acknowledged', acknowledged_at:now, updated_at:now });
  return getById(tenantId, id);
};

const summaryStats = async (tenantId, query) => {
  const rows = await db('performance_reviews')
    .where({ tenant_id:tenantId, deleted_at:null })
    .whereNot({ status:'draft' })
    .select('overall_score','status');
  const avg = rows.length ? rows.reduce((s,r)=>s+r.overall_score,0)/rows.length : 0;
  return {
    total:        rows.length,
    avg_score:    Math.round(avg*100)/100,
    acknowledged: rows.filter(r=>r.status==='acknowledged').length,
    submitted:    rows.filter(r=>r.status==='submitted').length,
  };
};

module.exports = { list, getById, create, update, remove, submit, acknowledge, summaryStats };
