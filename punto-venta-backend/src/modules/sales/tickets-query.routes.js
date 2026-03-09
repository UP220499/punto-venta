'use strict';

const service = require('./tickets-query.service');
const { requirePermission } = require('../../shared/permissions');

async function ticketsQueryRoutes(fastify) {
  // Require JWT on all routes in this plugin (skip OPTIONS for CORS preflight)
  fastify.addHook('onRequest', async (request, reply) => {
    if (request.method === 'OPTIONS') return;
    await fastify.authenticate(request, reply);
  });

  // GET /tickets
  // Query params: page, page_size, estatus, folio, from, to
  fastify.get('/', { preHandler: [requirePermission('SALE_VIEW')] }, async function (request, reply) {
    const { business_id } = request.user;
    const result = await service.listTickets(business_id, request.query);
    return reply.send(result);
  });

  // GET /tickets/:ticket_id
  fastify.get('/:ticket_id', { preHandler: [requirePermission('SALE_VIEW')] }, async function (request, reply) {
    const ticketId = Number(request.params.ticket_id);
    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      return reply.code(400).send({
        error: { code: 'INVALID_TICKET_ID', message: 'ticket_id must be a positive integer' },
      });
    }

    const { business_id } = request.user;
    const result = await service.getTicketDetail(ticketId, business_id);
    return reply.send(result);
  });
}

module.exports = ticketsQueryRoutes;
