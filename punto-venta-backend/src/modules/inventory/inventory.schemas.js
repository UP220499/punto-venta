'use strict';

const { z } = require('zod');

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

/* ── POST /inventory/entries ─────────────────────────── */

const entryBody = z.object({
  items: z.array(z.object({
    product_id: z.number().int().positive(),
    cantidad: z.number().positive(),
    nota: z.string().trim().max(200).optional(),
  })).min(1, 'At least one item is required'),
});

/* ── POST /inventory/adjustments ─────────────────────── */

const adjustmentBody = z.object({
  items: z.array(z.object({
    product_id: z.number().int().positive(),
    qty_delta: z.number().refine((v) => v !== 0, { message: 'qty_delta must not be zero' }),
    nota: z.string().trim().min(3).max(200),
  })).min(1, 'At least one item is required'),
});

/* ── GET /inventory/movements ────────────────────────── */

const movementsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(20),
  product_id: z.coerce.number().int().positive().optional(),
  tipo: z.enum(['ENTRADA', 'AJUSTE', 'VENTA']).optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
});

/* ── GET /inventory/products/low-stock ───────────────── */

const lowStockQuery = z.object({
  threshold: z.coerce.number().min(0).default(0),
});

module.exports = {
  parse,
  entryBody,
  adjustmentBody,
  movementsQuery,
  lowStockQuery,
};
