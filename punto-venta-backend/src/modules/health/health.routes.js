'use strict';

const { ping } = require('../../config/db');
const { name, version } = require('../../../package.json');

async function healthRoutes(fastify) {
  // GET /health — basic liveness check
  fastify.get('/health', async function (request, reply) {
    return reply.send({ ok: true });
  });

  // GET /health/version — build/version info (no auth required)
  fastify.get('/health/version', async function (_request, reply) {
    return reply.send({
      name,
      version,
      node:           process.version,
      env:            process.env.NODE_ENV || 'development',
      uptime_seconds: Math.floor(process.uptime()),
      commit:         process.env.GIT_COMMIT || null,
    });
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
