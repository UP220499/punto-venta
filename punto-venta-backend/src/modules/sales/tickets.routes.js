'use strict';

const { createTicketSchema, closeTicketSchema, parse } = require('./tickets.schemas');
const service = require('./tickets.service');
const { requirePermission } = require('../../shared/permissions');

async function ticketRoutes(fastify) {
  // All ticket routes require authentication (skip OPTIONS for CORS preflight)
  fastify.addHook('onRequest', async (request, reply) => {
    if (request.method === 'OPTIONS') return;
    await fastify.authenticate(request, reply);
  });

  // POST /tickets — SALE_CREATE
  fastify.post('/', { preHandler: [requirePermission('SALE_CREATE')] }, async function (request, reply) {
    const { items } = parse(createTicketSchema, request.body);
    const { business_id, sub: userId } = request.user;

    const result = await service.createTicket(business_id, userId, items);

    return reply.code(201).send(result);
  });

  // POST /tickets/:ticket_id/close — SALE_CLOSE
  fastify.post('/:ticket_id/close', { preHandler: [requirePermission('SALE_CLOSE')] }, async function (request, reply) {
    const ticketId = Number(request.params.ticket_id);
    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      return reply.code(400).send({ error: { code: 'INVALID_TICKET_ID', message: 'ticket_id must be a positive integer' } });
    }

    const { payments } = parse(closeTicketSchema, request.body);
    const { business_id, sub: userId } = request.user;

    const result = await service.closeTicket(business_id, userId, ticketId, payments);

    return reply.send(result);
  });
}

module.exports = ticketRoutes;
