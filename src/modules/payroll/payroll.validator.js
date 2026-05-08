const { z } = require('zod');

const createCycleSchema = z.object({
  year:  z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  notes: z.string().max(500).optional(),
});

const editRecordSchema = z.object({
  bonus:            z.number().min(0).optional(),
  other_deductions: z.number().min(0).optional(),
  notes:            z.string().max(500).optional(),
});

module.exports = { createCycleSchema, editRecordSchema };
