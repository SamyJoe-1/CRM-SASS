const { z } = require('zod');

const createKpiSchema = z.object({
  title:         z.string().min(1).max(200),
  description:   z.string().max(500).optional(),
  unit:          z.enum(['number','percentage','currency']).default('number'),
  target_value:  z.number(),
  current_value: z.number().default(0),
  period:        z.string().max(100).optional(),
  start_date:    z.string().optional(),
  end_date:      z.string().optional(),
  scope:         z.enum(['employee','department','company']).default('employee'),
  employee_id:   z.string().uuid().optional().nullable(),
  department_id: z.string().uuid().optional().nullable(),
});

const updateProgressSchema = z.object({
  new_value: z.number(),
  notes:     z.string().max(500).optional(),
});

module.exports = { createKpiSchema, updateProgressSchema };
