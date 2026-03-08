'use strict';

const {
  parse,
  listProductsQuery,
  createProductBody,
  updateProductBody,
  createBarcodeBody,
} = require('./products.schemas');
const service = require('./products.service');
const { requirePermission } = require('../../shared/permissions');

async function productRoutes(fastify) {
  // Auth required – skip OPTIONS for CORS preflight
  fastify.addHook('onRequest', async (request, reply) => {
    if (request.method === 'OPTIONS') return;
    await fastify.authenticate(request, reply);
  });

  // GET /products — PRODUCT_READ
  fastify.get('/', { preHandler: [requirePermission('PRODUCT_READ')] }, async function (request, reply) {
    const query = parse(listProductsQuery, request.query);
    const { business_id } = request.user;
    const result = await service.listProducts(business_id, query);
    return reply.send(result);
  });

  // POST /products — PRODUCT_WRITE
  fastify.post('/', { preHandler: [requirePermission('PRODUCT_WRITE')] }, async function (request, reply) {
    const data = parse(createProductBody, request.body);
    const { business_id, sub: userId } = request.user;
    const result = await service.createProduct(business_id, userId, data);
    return reply.code(201).send(result);
  });

  // PATCH /products/:product_id — PRODUCT_WRITE
  fastify.patch('/:product_id', { preHandler: [requirePermission('PRODUCT_WRITE')] }, async function (request, reply) {
    const productId = Number(request.params.product_id);
    if (!Number.isInteger(productId) || productId <= 0) {
      return reply.code(400).send({ error: { code: 'INVALID_PRODUCT_ID', message: 'product_id must be a positive integer' } });
    }
    const data = parse(updateProductBody, request.body);
    if (Object.keys(data).length === 0) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: 'No fields to update' } });
    }
    const { business_id } = request.user;
    const result = await service.updateProduct(business_id, productId, data);
    return reply.send(result);
  });

  // POST /products/:product_id/barcodes — PRODUCT_WRITE
  fastify.post('/:product_id/barcodes', { preHandler: [requirePermission('PRODUCT_WRITE')] }, async function (request, reply) {
    const productId = Number(request.params.product_id);
    if (!Number.isInteger(productId) || productId <= 0) {
      return reply.code(400).send({ error: { code: 'INVALID_PRODUCT_ID', message: 'product_id must be a positive integer' } });
    }
    const data = parse(createBarcodeBody, request.body);
    const { business_id } = request.user;
    const result = await service.addBarcode(business_id, productId, data);
    return reply.code(201).send(result);
  });

  // DELETE /products/:product_id/barcodes/:barcode_id — PRODUCT_WRITE
  fastify.delete('/:product_id/barcodes/:barcode_id', { preHandler: [requirePermission('PRODUCT_WRITE')] }, async function (request, reply) {
    const productId = Number(request.params.product_id);
    const barcodeId = Number(request.params.barcode_id);
    if (!Number.isInteger(productId) || productId <= 0) {
      return reply.code(400).send({ error: { code: 'INVALID_PRODUCT_ID', message: 'product_id must be a positive integer' } });
    }
    if (!Number.isInteger(barcodeId) || barcodeId <= 0) {
      return reply.code(400).send({ error: { code: 'INVALID_BARCODE_ID', message: 'barcode_id must be a positive integer' } });
    }
    const { business_id } = request.user;
    await service.deleteBarcode(business_id, productId, barcodeId);
    return reply.code(204).send();
  });
}

module.exports = productRoutes;
