'use strict';

const { z } = require('zod');

const UPPER_SNAKE_RE = /^[A-Z0-9_]+$/;

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

const createBody = z.object({
  code:               z.string()
    .min(2, 'code must be at least 2 characters')
    .max(30, 'code must be at most 30 characters')
    .regex(UPPER_SNAKE_RE, 'code must be UPPER_SNAKE_CASE (A-Z, 0-9, _)'),
  nombre_visible:     z.string().min(2, 'nombre_visible must be at least 2 characters').max(60),
  sort_order:         z.number().int().min(0).default(0),
  requires_reference: z.boolean().default(false),
});

const patchBody = z
  .object({
    nombre_visible:     z.string().min(2).max(60).optional(),
    estatus:            z.enum(['ACTIVO', 'INACTIVO']).optional(),
    sort_order:         z.number().int().min(0).optional(),
    requires_reference: z.boolean().optional(),
  })
  .strict()
  .refine(
    (d) => d.nombre_visible !== undefined || d.estatus !== undefined ||
           d.sort_order !== undefined || d.requires_reference !== undefined,
    { message: 'At least one field (nombre_visible, estatus, sort_order, requires_reference) is required' },
  );

module.exports = { parse, createBody, patchBody };
