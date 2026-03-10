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

const putPermissionsBody = z.object({
  permission_codes: z.array(z.string().min(1)).default([]),
});

module.exports = { parse, putPermissionsBody };
