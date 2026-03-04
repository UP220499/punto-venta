'use strict';

const authRoutes = require('../modules/auth/auth.routes');
const healthRoutes = require('../modules/health/health.routes');
const ticketRoutes = require('../modules/sales/tickets.routes');

async function registerRoutes(fastify) {
  fastify.register(authRoutes, { prefix: '/auth' });
  fastify.register(healthRoutes);
  fastify.register(ticketRoutes, { prefix: '/tickets' });
}

module.exports = registerRoutes;
