const { z } = require('zod');

const createEmployeeSchema = z.object({
  department_id:             z.string().uuid().optional().nullable(),
  position_id:               z.string().uuid().optional().nullable(),
  employee_number:           z.string().max(50).optional(),
  first_name:                z.string().min(1).max(100),
  last_name:                 z.string().min(1).max(100),
  first_name_ar:             z.string().max(100).optional().nullable(),
  last_name_ar:              z.string().max(100).optional().nullable(),
  gender:                    z.enum(['male','female','other']).optional().nullable(),
  date_of_birth:             z.string().optional().nullable(),
  nationality:               z.string().max(100).optional().nullable(),
  national_id:               z.string().max(50).optional().nullable(),
  passport_number:           z.string().max(50).optional().nullable(),
  personal_email:            z.string().email().optional().nullable(),
  work_email:                z.string().email().optional().nullable(),
  phone:                     z.string().max(30).optional().nullable(),
  address:                   z.string().max(500).optional().nullable(),
  hire_date:                 z.string(),
  contract_start_date:       z.string().optional().nullable(),
  contract_end_date:         z.string().optional().nullable(),
  contract_type:             z.enum(['full_time','part_time','contract','intern']).default('full_time'),
  base_salary:               z.number().min(0),
  allowances:                z.number().min(0).default(0),
  bank_name:                 z.string().max(100).optional().nullable(),
  bank_account_number:       z.string().max(50).optional().nullable(),
  bank_iban:                 z.string().max(50).optional().nullable(),
  tax_id:                    z.string().max(50).optional().nullable(),
  insurance_id:              z.string().max(50).optional().nullable(),
  emergency_contact_name:    z.string().max(100).optional().nullable(),
  emergency_contact_phone:   z.string().max(30).optional().nullable(),
  emergency_contact_relation:z.string().max(50).optional().nullable(),
  notes:                     z.string().max(1000).optional().nullable(),
});

const updateEmployeeSchema = createEmployeeSchema.partial();

const terminateSchema = z.object({
  termination_date:   z.string(),
  termination_reason: z.string().max(500).optional(),
});

module.exports = { createEmployeeSchema, updateEmployeeSchema, terminateSchema };
