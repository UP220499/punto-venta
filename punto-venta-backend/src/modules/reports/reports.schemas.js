'use strict';

const { z } = require('zod');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

/* ── sales summary (from/to optional) ────────────────── */

const salesSummaryQuery = z.object({
  from: z.string().regex(DATE_RE, 'from must be yyyy-mm-dd').optional(),
  to: z.string().regex(DATE_RE, 'to must be yyyy-mm-dd').optional(),
});

/* ── sales by-day / top-products / inventory (from/to required) */

const dateRangeQuery = z.object({
  from: z.string().regex(DATE_RE, 'from must be yyyy-mm-dd'),
  to: z.string().regex(DATE_RE, 'to must be yyyy-mm-dd'),
});

const topProductsQuery = z.object({
  from: z.string().regex(DATE_RE, 'from must be yyyy-mm-dd'),
  to: z.string().regex(DATE_RE, 'to must be yyyy-mm-dd'),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

module.exports = {
  parse,
  salesSummaryQuery,
  dateRangeQuery,
  topProductsQuery,
};
