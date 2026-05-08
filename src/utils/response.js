const success = (res, data, statusCode = 200, meta = null) => {
  const payload = { success: true, data };
  if (meta) payload.meta = meta;
  return res.status(statusCode).json(payload);
};

const created = (res, data) => success(res, data, 201);

const noContent = (res) => res.status(204).send();

const paginated = (res, data, meta) => success(res, data, 200, meta);

module.exports = { success, created, noContent, paginated };
