'use strict';

const service = require('./products.service');
const { requirePermission } = require('../../shared/permissions');

async function barcodeRoutes(fastify) {
  // Auth required – skip OPTIONS for CORS preflight
  fastify.addHook('onRequest', async (request, reply) => {
    if (request.method === 'OPTIONS') return;
    await fastify.authenticate(request, reply);
  });

  // GET /barcodes/:barcode_value — PRODUCT_READ
  fastify.get('/:barcode_value', { preHandler: [requirePermission('PRODUCT_READ')] }, async function (request, reply) {
    const { barcode_value } = request.params;
    if (!barcode_value || !barcode_value.trim()) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: 'barcode_value is required' } });
    }
    const { business_id } = request.user;
    const result = await service.lookupBarcode(business_id, barcode_value.trim());
    return reply.send(result);
  });
}

module.exports = barcodeRoutes;
