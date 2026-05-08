const { z } = require('zod');

const leaveTypeSchema = z.object({
  name:              z.string().min(1).max(100),
  name_ar:           z.string().max(100).optional().nullable(),
  default_days:      z.number().int().min(0),
  is_paid:           z.boolean().default(true),
  requires_approval: z.boolean().default(true),
});

const leaveRequestSchema = z.object({
  employee_id:   z.string().uuid(),
  leave_type_id: z.string().uuid(),
  start_date:    z.string(),
  end_date:      z.string(),
  reason:        z.string().max(500).optional(),
});

const reviewSchema = z.object({
  review_notes: z.string().max(500).optional(),
});

module.exports = { leaveTypeSchema, leaveRequestSchema, reviewSchema };
