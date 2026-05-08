const { v4: uuidv4 } = require('uuid');
const db             = require('../../config/database');
const { NotFoundError } = require('../../utils/AppError');
const { getPagination, buildMeta } = require('../../utils/pagination');

const list = async (tenantId, query) => {
  const { page, per_page, offset } = getPagination(query);
  const base = () => db('kpis').where({ 'kpis.tenant_id':tenantId, 'kpis.deleted_at':null });
  let q = base()
    .leftJoin('employees','employees.id','kpis.employee_id')
    .leftJoin('departments','departments.id','kpis.department_id')
    .select('kpis.*','employees.first_name','employees.last_name','departments.name as department_name');
  if (query.status)        q.where('kpis.status', query.status);
  if (query.scope)         q.where('kpis.scope',  query.scope);
  if (query.employee_id)   q.where('kpis.employee_id',   query.employee_id);
  if (query.department_id) q.where('kpis.department_id', query.department_id);
  q.orderBy('kpis.created_at','desc');
  const [{ count }] = await base().count('kpis.id as count');
  const data        = await q.limit(per_page).offset(offset);
  return { data, meta: buildMeta(page, per_page, Number(count)) };
};

const getById = async (tenantId, id) => {
  const k = await db('kpis').where({ id, tenant_id:tenantId, deleted_at:null })
    .leftJoin('employees','employees.id','kpis.employee_id')
    .leftJoin('departments','departments.id','kpis.department_id')
    .select('kpis.*','employees.first_name','employees.last_name','departments.name as department_name')
    .first();
  if (!k) throw new NotFoundError('KPI not found');
  return k;
};

const create = async (tenantId, userId, data) => {
  const now = new Date().toISOString();
  const id  = uuidv4();
  await db('kpis').insert({ id, tenant_id:tenantId, created_by:userId, ...data, created_at:now, updated_at:now });
  return getById(tenantId, id);
};

const update = async (tenantId, id, data) => {
  await getById(tenantId, id);
  const payload = { ...data, updated_at:new Date().toISOString() };
  if (data.current_value !== undefined && data.target_value !== undefined) {
    payload.status = data.current_value >= data.target_value ? 'achieved' : 'in_progress';
  }
  await db('kpis').where({ id, tenant_id:tenantId }).update(payload);
  return getById(tenantId, id);
};

const remove = async (tenantId, id) => {
  await getById(tenantId, id);
  await db('kpis').where({ id, tenant_id:tenantId }).update({ deleted_at:new Date().toISOString() });
};

const updateProgress = async (tenantId, id, userId, { new_value, notes }) => {
  const kpi = await getById(tenantId, id);
  const now  = new Date().toISOString();

  await db('kpi_updates').insert({
    id: uuidv4(), tenant_id:tenantId, kpi_id:id,
    updated_by:userId, previous_value:kpi.current_value, new_value, notes,
    created_at:now, updated_at:now,
  });

  const newStatus = new_value >= kpi.target_value ? 'achieved' : 'in_progress';
  await db('kpis').where({ id }).update({ current_value:new_value, status:newStatus, updated_at:now });
  return getById(tenantId, id);
};

const dashboard = async (tenantId) => {
  const kpis = await db('kpis').where({ tenant_id:tenantId, deleted_at:null });
  return {
    total:       kpis.length,
    achieved:    kpis.filter(k=>k.status==='achieved').length,
    in_progress: kpis.filter(k=>k.status==='in_progress').length,
    avg_progress:kpis.length ? Math.round(kpis.reduce((s,k)=>s+(k.target_value>0?(k.current_value/k.target_value)*100:0),0)/kpis.length) : 0,
  };
};

module.exports = { list, getById, create, update, remove, updateProgress, dashboard };
