'use strict';

const authRoutes = require('../modules/auth/auth.routes');
const healthRoutes = require('../modules/health/health.routes');
const ticketRoutes = require('../modules/sales/tickets.routes');
const productRoutes = require('../modules/products/products.routes');
const barcodeRoutes = require('../modules/products/barcodes.routes');

async function registerRoutes(fastify) {
  fastify.register(authRoutes, { prefix: '/auth' });
  fastify.register(healthRoutes);
  fastify.register(ticketRoutes, { prefix: '/tickets' });
  fastify.register(productRoutes, { prefix: '/products' });
  fastify.register(barcodeRoutes, { prefix: '/barcodes' });
}

module.exports = registerRoutes;
