const { ValidationError } = require('../utils/AppError');

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const fieldErrors = {};
    result.error.errors.forEach((e) => {
      const key = e.path.join('.');
      fieldErrors[key] = e.message;
    });
    throw new ValidationError('Validation failed', fieldErrors);
  }
  req.validated = result.data;
  next();
};

module.exports = validate;
