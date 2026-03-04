'use strict';

const authRoutes = require('../modules/auth/auth.routes');
const healthRoutes = require('../modules/health/health.routes');

async function registerRoutes(fastify) {
  fastify.register(authRoutes, { prefix: '/auth' });
  fastify.register(healthRoutes);
}

module.exports = registerRoutes;
