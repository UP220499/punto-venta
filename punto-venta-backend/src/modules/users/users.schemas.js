'use strict';

const { z } = require('zod');

const USERNAME_RE = /^[a-zA-Z0-9._-]+$/;

function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const msg = result.error.issues.map((i) => i.message).join('; ');
    const err = new Error(msg);
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
  return result.data;
}

const listUsersQuery = z.object({
  page:      z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  q:         z.string().min(1).optional(),
  activo:    z.enum(['true', 'false']).optional(),
});

const createUserBody = z.object({
  username:   z.string()
    .min(3, 'username must be at least 3 characters')
    .max(40, 'username must be at most 40 characters')
    .regex(USERNAME_RE, 'username may only contain letters, digits, dots, underscores or hyphens'),
  nombre:     z.string().min(2, 'nombre must be at least 2 characters').max(120),
  password:   z.string().min(8, 'password must be at least 8 characters').max(72),
  role_codes: z.array(z.string().min(1)).min(1, 'role_codes must have at least one role'),
});

const patchUserBody = z
  .object({
    nombre: z.string().min(2).max(120).optional(),
    activo: z.boolean().optional(),
  })
  .strict()
  .refine(
    (d) => d.nombre !== undefined || d.activo !== undefined,
    { message: 'At least one field (nombre, activo) is required' },
  );

const resetPasswordBody = z.object({
  password: z.string().min(8, 'password must be at least 8 characters').max(72),
});

const putRolesBody = z.object({
  role_codes: z.array(z.string().min(1)).min(1, 'role_codes must have at least one role'),
});

module.exports = { parse, listUsersQuery, createUserBody, patchUserBody, resetPasswordBody, putRolesBody };
