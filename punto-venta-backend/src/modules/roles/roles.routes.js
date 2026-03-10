'use strict';

const service = require('./roles.service');
const { requirePermission } = require('../../shared/permissions');

function parseRoleId(params) {
  const id = Number(params.role_id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const INVALID_ROLE_ID = { error: { code: 'INVALID_ROLE_ID', message: 'role_id must be a positive integer' } };

async function rolesRoutes(fastify) {
  fastify.addHook('onRequest', async (request, reply) => {
    if (request.method === 'OPTIONS') return;
    await fastify.authenticate(request, reply);
  });

  // GET /roles
  fastify.get('/', { preHandler: [requirePermission('ROLE_READ')] }, async function (request, reply) {
    return reply.send(await service.listRoles());
  });

  // GET /roles/permissions  — static route, registered before /:role_id
  fastify.get('/permissions', { preHandler: [requirePermission('ROLE_READ')] }, async function (request, reply) {
    return reply.send(await service.listPermissions());
  });

  // GET /roles/:role_id
  fastify.get('/:role_id', { preHandler: [requirePermission('ROLE_READ')] }, async function (request, reply) {
    const roleId = parseRoleId(request.params);
    if (!roleId) return reply.code(400).send(INVALID_ROLE_ID);
    return reply.send(await service.getRoleById(roleId));
  });

  // PUT /roles/:role_id/permissions
  fastify.put('/:role_id/permissions', { preHandler: [requirePermission('ROLE_WRITE')] }, async function (request, reply) {
    const roleId = parseRoleId(request.params);
    if (!roleId) return reply.code(400).send(INVALID_ROLE_ID);
    return reply.send(await service.setRolePermissions(roleId, request.body));
  });
}

module.exports = rolesRoutes;
