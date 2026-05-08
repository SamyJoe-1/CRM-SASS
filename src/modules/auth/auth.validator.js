const { z } = require('zod');

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
});

const refreshSchema = z.object({
  refresh_token: z.string().min(10),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  token:    z.string().min(10),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
});

const updateMeSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name:  z.string().min(1).max(100).optional(),
  language:   z.enum(['en','ar']).optional(),
}).strict();

const changePasswordSchema = z.object({
  current_password: z.string().min(6),
  new_password:     z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
});

module.exports = { loginSchema, refreshSchema, forgotSchema, resetSchema, updateMeSchema, changePasswordSchema };
