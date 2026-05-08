const getPagination = (query) => {
  const page     = Math.max(1, parseInt(query.page     || '1',  10));
  const per_page = Math.min(100, Math.max(1, parseInt(query.per_page || '20', 10)));
  const offset   = (page - 1) * per_page;
  return { page, per_page, offset };
};

const buildMeta = (page, per_page, total) => ({
  page,
  per_page,
  total,
  total_pages: Math.ceil(total / per_page),
});

module.exports = { getPagination, buildMeta };
