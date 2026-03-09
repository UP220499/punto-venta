'use strict';

const service = require('./ticket-print.service');
const { requirePermission } = require('../../shared/permissions');

async function ticketPrintRoutes(fastify) {
  // Require JWT on all routes in this plugin (skip OPTIONS for CORS preflight)
  fastify.addHook('onRequest', async (request, reply) => {
    if (request.method === 'OPTIONS') return;
    await fastify.authenticate(request, reply);
  });

  // GET /tickets/:ticket_id/print/html
  // SALE_CREATE is chosen so that cajeros (who create and close tickets) can print.
  fastify.get(
    '/:ticket_id/print/html',
    { preHandler: [requirePermission('SALE_CREATE')] },
    async function (request, reply) {
      const ticketId = Number(request.params.ticket_id);
      if (!Number.isInteger(ticketId) || ticketId <= 0) {
        return reply.code(400).send({
          error: { code: 'INVALID_TICKET_ID', message: 'ticket_id must be a positive integer' },
        });
      }

      const { business_id } = request.user;
      const html = await service.renderTicketHtml(ticketId, business_id);

      return reply
        .header('Content-Type', 'text/html; charset=utf-8')
        .send(html);
    }
  );
}

module.exports = ticketPrintRoutes;
