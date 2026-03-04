'use strict';

const {
  parse,
  entryBody,
  adjustmentBody,
  movementsQuery,
  lowStockQuery,
} = require('./inventory.schemas');
const service = require('./inventory.service');

async function inventoryRoutes(fastify) {
  // Auth required – skip OPTIONS for CORS preflight
  fastify.addHook('onRequest', async (request, reply) => {
    if (request.method === 'OPTIONS') return;
    await fastify.authenticate(request, reply);
  });

  // POST /inventory/entries
  fastify.post('/entries', async function (request, reply) {
    const { items } = parse(entryBody, request.body);
    const { business_id, sub: userId } = request.user;
    const result = await service.applyEntries(business_id, userId, items);
    return reply.code(201).send(result);
  });

  // POST /inventory/adjustments
  fastify.post('/adjustments', async function (request, reply) {
    const { items } = parse(adjustmentBody, request.body);
    const { business_id, sub: userId } = request.user;
    const result = await service.applyAdjustments(business_id, userId, items);
    return reply.code(201).send(result);
  });

  // GET /inventory/movements
  fastify.get('/movements', async function (request, reply) {
    const query = parse(movementsQuery, request.query);
    const { business_id } = request.user;
    const result = await service.listMovements(business_id, query);
    return reply.send(result);
  });

  // GET /inventory/products/low-stock
  fastify.get('/products/low-stock', async function (request, reply) {
    const { threshold } = parse(lowStockQuery, request.query);
    const { business_id } = request.user;
    const result = await service.getLowStock(business_id, threshold);
    return reply.send(result);
  });
}

module.exports = inventoryRoutes;
