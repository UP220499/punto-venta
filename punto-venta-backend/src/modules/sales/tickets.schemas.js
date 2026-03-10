'use strict';

const { z } = require('zod');

const createTicketSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.number().int().positive(),
        cantidad: z.number().positive(),
      })
    )
    .min(1, 'At least one item is required'),
});

const closeTicketSchema = z.object({
  payments: z
    .array(
      z.object({
        method_code: z.string().min(1),
        monto: z.number().positive(),
        referencia: z
          .string()
          .trim()
          .max(80, 'referencia must be at most 80 characters')
          .nullish()
          .transform((value) => {
            if (value === null || value === undefined || value === '') return null;
            return value;
          }),
      })
    )
    .min(1, 'At least one payment is required'),
});

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

module.exports = { createTicketSchema, closeTicketSchema, parse };
