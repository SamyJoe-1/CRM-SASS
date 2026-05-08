const { z } = require('zod');

const clockInSchema = z.object({
  employee_id: z.string().uuid(),
  notes:       z.string().max(500).optional(),
});
const clockOutSchema = z.object({
  employee_id: z.string().uuid(),
  notes:       z.string().max(500).optional(),
});
const manualEditSchema = z.object({
  clock_in_at:  z.string().optional(),
  clock_out_at: z.string().optional(),
  status:       z.enum(['present','absent','late','on_leave','holiday','remote']).optional(),
  notes:        z.string().max(500).optional(),
});
const policySchema = z.object({
  work_start_time:       z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  work_end_time:         z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  grace_minutes:         z.number().int().min(0).max(120).default(15),
  working_days_per_week: z.number().int().min(1).max(7).default(5),
  working_days_json:     z.array(z.number().int().min(0).max(6)).default([1,2,3,4,5]),
  enforce_network_check: z.boolean().default(false),
  allowed_ips:           z.array(z.string()).optional(),
  allowed_ssids:         z.array(z.string()).optional(),
});

module.exports = { clockInSchema, clockOutSchema, manualEditSchema, policySchema };
