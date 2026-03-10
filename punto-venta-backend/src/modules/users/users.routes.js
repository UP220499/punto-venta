'use strict';

const service = require('./users.service');
const { requirePermission } = require('../../shared/permissions');

function parseUserId(params) {
  const id = Number(params.user_id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const INVALID_USER_ID = { error: { code: 'INVALID_USER_ID', message: 'user_id must be a positive integer' } };

async function usersRoutes(fastify) {
  fastify.addHook('onRequest', async (request, reply) => {
    if (request.method === 'OPTIONS') return;
    await fastify.authenticate(request, reply);
  });

  // GET /users
  fastify.get('/', { preHandler: [requirePermission('USER_READ')] }, async function (request, reply) {
    return reply.send(await service.listUsers(request.user.business_id, request.query));
  });

  // GET /users/:user_id
  fastify.get('/:user_id', { preHandler: [requirePermission('USER_READ')] }, async function (request, reply) {
    const userId = parseUserId(request.params);
    if (!userId) return reply.code(400).send(INVALID_USER_ID);
    return reply.send(await service.getUserById(userId, request.user.business_id));
  });

  // POST /users
  fastify.post('/', { preHandler: [requirePermission('USER_WRITE')] }, async function (request, reply) {
    const result = await service.createUser(request.user.business_id, request.body);
    return reply.code(201).send(result);
  });

  // PATCH /users/:user_id
  fastify.patch('/:user_id', { preHandler: [requirePermission('USER_WRITE')] }, async function (request, reply) {
    const userId = parseUserId(request.params);
    if (!userId) return reply.code(400).send(INVALID_USER_ID);
    return reply.send(
      await service.patchUser(userId, request.user.business_id, request.user.sub, request.body),
    );
  });

  // POST /users/:user_id/reset-password
  fastify.post('/:user_id/reset-password', { preHandler: [requirePermission('USER_WRITE')] }, async function (request, reply) {
    const userId = parseUserId(request.params);
    if (!userId) return reply.code(400).send(INVALID_USER_ID);
    await service.resetPassword(userId, request.user.business_id, request.body);
    return reply.code(204).send();
  });

  // PUT /users/:user_id/roles
  fastify.put('/:user_id/roles', { preHandler: [requirePermission('USER_WRITE')] }, async function (request, reply) {
    const userId = parseUserId(request.params);
    if (!userId) return reply.code(400).send(INVALID_USER_ID);
    return reply.send(
      await service.setUserRoles(userId, request.user.business_id, request.user.sub, request.body),
    );
  });
}

module.exports = usersRoutes;
