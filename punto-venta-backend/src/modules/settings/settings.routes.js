'use strict';

const { parse, patchSettingsBody } = require('./settings.schemas');
const service = require('./settings.service');
const repo = require('./settings.repository');
const { requirePermission } = require('../../shared/permissions');

const BRANDING_DEFAULTS = {
  business_name: 'Mi Negocio',
  business_subtitle: null,
  brand_logo_url: null,
  brand_primary_color: null,
  brand_surface_dark: null,
};

async function settingsRoutes(fastify) {
  // Public endpoint — no auth required
  fastify.get('/branding', async (request, reply) => {
    const row = await repo.getPublicBranding();
    return reply.send(row ?? BRANDING_DEFAULTS);
  });

  // Auth required – skip OPTIONS for CORS preflight and public /branding
  fastify.addHook('onRequest', async (request, reply) => {
    if (request.method === 'OPTIONS') return;
    if (request.routeOptions?.url?.endsWith('/branding')) return;
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
