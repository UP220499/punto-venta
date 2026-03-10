'use strict';

const service = require('./payment-methods.service');
const { requirePermission } = require('../../shared/permissions');

function parseMethodId(params) {
  const id = Number(params.payment_method_id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const INVALID_ID = {
  error: { code: 'INVALID_PAYMENT_METHOD_ID', message: 'payment_method_id must be a positive integer' },
};

async function paymentMethodsRoutes(fastify) {
  fastify.addHook('onRequest', async (request, reply) => {
    if (request.method === 'OPTIONS') return;
    await fastify.authenticate(request, reply);
  });

  // GET /payment-methods
  fastify.get('/', { preHandler: [requirePermission('PAYMENT_METHOD_READ')] }, async function (request, reply) {
    return reply.send(await service.listPaymentMethods());
  });

  // POST /payment-methods
  fastify.post('/', { preHandler: [requirePermission('PAYMENT_METHOD_WRITE')] }, async function (request, reply) {
    const result = await service.createPaymentMethod(request.body);
    return reply.code(201).send(result);
  });

  // PATCH /payment-methods/:payment_method_id
  fastify.patch('/:payment_method_id', { preHandler: [requirePermission('PAYMENT_METHOD_WRITE')] }, async function (request, reply) {
    const methodId = parseMethodId(request.params);
    if (!methodId) return reply.code(400).send(INVALID_ID);
    return reply.send(await service.patchPaymentMethod(methodId, request.body));
  });

  // DELETE /payment-methods/:payment_method_id  (soft-delete → estatus INACTIVO)
  fastify.delete('/:payment_method_id', { preHandler: [requirePermission('PAYMENT_METHOD_WRITE')] }, async function (request, reply) {
    const methodId = parseMethodId(request.params);
    if (!methodId) return reply.code(400).send(INVALID_ID);
    await service.deletePaymentMethod(methodId);
    return reply.code(204).send();
  });
}

module.exports = paymentMethodsRoutes;
