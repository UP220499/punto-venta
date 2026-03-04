'use strict';

const { ping } = require('../../config/db');

async function healthRoutes(fastify) {
  // GET /health — basic liveness check
  fastify.get('/health', async function (request, reply) {
    return reply.send({ ok: true });
  });

  // GET /health/db — verifies database connectivity
  fastify.get('/health/db', async function (request, reply) {
    try {
      await ping();
      return reply.send({ ok: true });
    } catch (err) {
      request.log.error(err, 'Database health check failed');
      return reply.code(500).send({ error: { code: 'DB_ERROR', message: 'Database connection failed' } });
    }
  });
}

module.exports = healthRoutes;
