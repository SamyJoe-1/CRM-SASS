const { z } = require('zod');

const createReviewSchema = z.object({
  employee_id:  z.string().uuid(),
  period_label: z.string().min(1).max(100),
  period_start: z.string(),
  period_end:   z.string(),
  criteria:     z.array(z.object({
    label:  z.string().min(1),
    score:  z.number().min(0).max(10),
    weight: z.number().min(0).max(1),
  })).min(1),
  comments:     z.string().max(2000).optional(),
});

const updateReviewSchema = createReviewSchema.partial();

module.exports = { createReviewSchema, updateReviewSchema };
