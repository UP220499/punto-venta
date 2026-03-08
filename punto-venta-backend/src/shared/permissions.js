'use strict';

/**
 * Returns a Fastify preHandler that checks whether the authenticated user
 * has the given permission code embedded in their JWT.
 *
 * Usage (inside a route definition):
 *   fastify.get('/path', { preHandler: [requirePermission('PRODUCT_READ')] }, handler)
 */
function requirePermission(code) {
  return async function checkPermission(request, reply) {
    const perms = request.user && request.user.permissions;
    if (!Array.isArray(perms) || !perms.includes(code)) {
      return reply.code(403).send({
        error: {
          code: 'FORBIDDEN',
          message: `Missing permission: ${code}`,
        },
      });
    }
  };
}

module.exports = { requirePermission };
