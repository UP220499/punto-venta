'use strict';

const service = require('./audit.service');
const { requirePermission } = require('../../shared/permissions');

async function auditRoutes(fastify) {
  fastify.addHook('onRequest', async (request, reply) => {
    if (request.method === 'OPTIONS') return;
    await fastify.authenticate(request, reply);
  });

  // GET /audit
  fastify.get('/', { preHandler: [requirePermission('AUDIT_READ')] }, async function (request, reply) {
    const { business_id } = request.user;
    const result = await service.listAuditLogs(business_id, request.query);
    return reply.send(result);
  });
}

module.exports = auditRoutes;
