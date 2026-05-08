const db = require('../../config/database');
const { getPagination, buildMeta } = require('../../utils/pagination');
const { toCsv, toExcel } = require('../../utils/exportHelper');

const list = async (tenantId, query) => {
  const { page, per_page, offset } = getPagination(query);
  const base = () => db('audit_logs').where({ tenant_id:tenantId });
  let q = base()
    .leftJoin('users','users.id','audit_logs.user_id')
    .select('audit_logs.*','users.first_name','users.last_name','users.email');
  if (query.module) q.where('audit_logs.module', query.module);
  if (query.action) q.where('audit_logs.action', query.action);
  if (query.user_id)q.where('audit_logs.user_id',query.user_id);
  if (query.date_from) q.where('audit_logs.created_at','>=',query.date_from);
  if (query.date_to)   q.where('audit_logs.created_at','<=',query.date_to+' 23:59:59');
  q.orderBy('audit_logs.created_at','desc');
  const [{ count }] = await base().count('audit_logs.id as count');
  const data = await q.limit(per_page).offset(offset);
  return { data, meta: buildMeta(page, per_page, Number(count)) };
};

const exportLogs = async (tenantId, query, format='xlsx') => {
  const { data } = await list(tenantId, { ...query, per_page:10000, page:1 });
  const cols = [
    {key:'created_at',label:'Timestamp'},{key:'email',label:'User'},{key:'module',label:'Module'},
    {key:'action',label:'Action'},{key:'record_id',label:'Record ID'},{key:'ip_address',label:'IP'},
  ];
  if (format==='csv') return toCsv(cols, data);
  return toExcel(cols, data, 'Audit Logs');
};

module.exports = { list, exportLogs };
