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

const listAuditQuery = z.object({
  page:          z.coerce.number().int().min(1).default(1),
  page_size:     z.coerce.number().int().min(1).max(100).default(20),
  severity:      z.enum(['INFO', 'WARN', 'ERROR']).optional(),
  event_code:    z.string().min(1).optional(),
  actor_user_id: z.coerce.number().int().min(1).optional(),
  entity_type:   z.string().min(1).optional(),
  entity_id:     z.coerce.number().int().min(1).optional(),
  from:          z.string().regex(DATE_RE, 'from must be yyyy-mm-dd').optional(),
  to:            z.string().regex(DATE_RE, 'to must be yyyy-mm-dd').optional(),
});

module.exports = { parse, listAuditQuery };
