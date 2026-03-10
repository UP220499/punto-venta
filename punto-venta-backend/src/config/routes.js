'use strict';

const authRoutes = require('../modules/auth/auth.routes');
const healthRoutes = require('../modules/health/health.routes');
const ticketRoutes = require('../modules/sales/tickets.routes');
const ticketPrintRoutes = require('../modules/sales/ticket-print.routes');
const ticketPdfRoutes = require('../modules/sales/ticket-pdf.routes');
const ticketsQueryRoutes = require('../modules/sales/tickets-query.routes');
const productRoutes = require('../modules/products/products.routes');
const barcodeRoutes = require('../modules/products/barcodes.routes');
const inventoryRoutes = require('../modules/inventory/inventory.routes');
const reportRoutes = require('../modules/reports/reports.routes');
const settingsRoutes = require('../modules/settings/settings.routes');
const auditRoutes    = require('../modules/audit/audit.routes');
const usersRoutes    = require('../modules/users/users.routes');

async function registerRoutes(fastify) {
  fastify.register(authRoutes, { prefix: '/auth' });
  fastify.register(healthRoutes);
  fastify.register(ticketRoutes, { prefix: '/tickets' });
  fastify.register(ticketPrintRoutes, { prefix: '/tickets' });
  fastify.register(ticketPdfRoutes, { prefix: '/tickets' });
  fastify.register(ticketsQueryRoutes, { prefix: '/tickets' });
  fastify.register(productRoutes, { prefix: '/products' });
  fastify.register(barcodeRoutes, { prefix: '/barcodes' });
  fastify.register(inventoryRoutes, { prefix: '/inventory' });
  fastify.register(reportRoutes, { prefix: '/reports' });
  fastify.register(settingsRoutes, { prefix: '/settings' });
  fastify.register(auditRoutes,    { prefix: '/audit' });
  fastify.register(usersRoutes,    { prefix: '/users' });
}

module.exports = registerRoutes;
