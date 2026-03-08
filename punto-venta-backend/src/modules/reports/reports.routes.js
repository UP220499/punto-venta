'use strict';

const { parse, salesSummaryQuery, dateRangeQuery, topProductsQuery } = require('./reports.schemas');
const service = require('./reports.service');
const { requirePermission } = require('../../shared/permissions');

async function reportRoutes(fastify) {
  // Auth required – skip OPTIONS for CORS preflight
  fastify.addHook('onRequest', async (request, reply) => {
    if (request.method === 'OPTIONS') return;
    await fastify.authenticate(request, reply);
  });

  // GET /reports/sales/summary — REPORT_READ
  fastify.get('/sales/summary', { preHandler: [requirePermission('REPORT_READ')] }, async function (request, reply) {
    const { from, to } = parse(salesSummaryQuery, request.query);
    const { business_id } = request.user;
    const result = await service.salesSummary(business_id, from, to);
    return reply.send(result);
  });

  // GET /reports/sales/by-day — REPORT_READ
  fastify.get('/sales/by-day', { preHandler: [requirePermission('REPORT_READ')] }, async function (request, reply) {
    const { from, to } = parse(dateRangeQuery, request.query);
    const { business_id } = request.user;
    const result = await service.salesByDay(business_id, from, to);
    return reply.send(result);
  });

  // GET /reports/top-products — REPORT_READ
  fastify.get('/top-products', { preHandler: [requirePermission('REPORT_READ')] }, async function (request, reply) {
    const { from, to, limit } = parse(topProductsQuery, request.query);
    const { business_id } = request.user;
    const result = await service.topProducts(business_id, from, to, limit);
    return reply.send(result);
  });

  // GET /reports/inventory/summary — REPORT_READ
  fastify.get('/inventory/summary', { preHandler: [requirePermission('REPORT_READ')] }, async function (request, reply) {
    const { from, to } = parse(dateRangeQuery, request.query);
    const { business_id } = request.user;
    const result = await service.inventorySummary(business_id, from, to);
    return reply.send(result);
  });
}

module.exports = reportRoutes;
