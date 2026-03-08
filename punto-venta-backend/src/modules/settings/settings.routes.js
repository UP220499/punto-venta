'use strict';

const { parse, patchSettingsBody } = require('./settings.schemas');
const service = require('./settings.service');
const { requirePermission } = require('../../shared/permissions');

async function settingsRoutes(fastify) {
  // Auth required – skip OPTIONS for CORS preflight
  fastify.addHook('onRequest', async (request, reply) => {
    if (request.method === 'OPTIONS') return;
    await fastify.authenticate(request, reply);
  });

  // GET /settings — SETTINGS_READ
  fastify.get('/', { preHandler: [requirePermission('SETTINGS_READ')] }, async function (request, reply) {
    const { business_id } = request.user;
    const result = await service.getSettings(business_id);
    return reply.send(result);
  });

  // PATCH /settings — SETTINGS_WRITE
  fastify.patch('/', { preHandler: [requirePermission('SETTINGS_WRITE')] }, async function (request, reply) {
    const patch = parse(patchSettingsBody, request.body);
    if (Object.keys(patch).length === 0) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: 'No fields to update' } });
    }
    const { business_id, sub: userId } = request.user;
    const result = await service.updateSettings(business_id, patch, userId);
    return reply.send(result);
  });
}

module.exports = settingsRoutes;
