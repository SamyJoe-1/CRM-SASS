/**
 * Applies common filter/search/sort params to a Knex query builder.
 * All bindings are parameterized – no string interpolation into SQL.
 */
const applyFilters = (qb, query, opts = {}) => {
  const {
    searchColumns  = [],
    allowedSortCols = ['created_at'],
    tableAlias     = null,
  } = opts;

  const col = (c) => tableAlias ? `${tableAlias}.${c}` : c;

  // full-text search across specified columns
  if (query.search && searchColumns.length) {
    qb.where((builder) => {
      searchColumns.forEach((c) => {
        builder.orWhere(col(c), 'like', `%${query.search}%`);
      });
    });
  }

  if (query.status)        qb.where(col('status'),        query.status);
  if (query.department_id) qb.where(col('department_id'), query.department_id);
  if (query.employee_id)   qb.where(col('employee_id'),   query.employee_id);
  if (query.tenant_id)     qb.where(col('tenant_id'),     query.tenant_id);

  if (query.date_from)     qb.where(col('created_at'), '>=', query.date_from);
  if (query.date_to)       qb.where(col('created_at'), '<=', query.date_to + ' 23:59:59');

  // generic min/max numeric filters (e.g. min_salary=1000)
  Object.keys(query).forEach((k) => {
    const minMatch = k.match(/^min_(.+)$/);
    const maxMatch = k.match(/^max_(.+)$/);
    if (minMatch) qb.where(col(minMatch[1]), '>=', parseFloat(query[k]));
    if (maxMatch) qb.where(col(maxMatch[1]), '<=', parseFloat(query[k]));
  });

  // sorting
  const sortBy  = allowedSortCols.includes(query.sort_by) ? query.sort_by : 'created_at';
  const sortDir = query.sort_dir === 'asc' ? 'asc' : 'desc';
  qb.orderBy(col(sortBy), sortDir);

  return qb;
};

module.exports = { applyFilters };
