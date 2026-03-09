'use strict';

const pdfService = require('./ticket-pdf.service');
const { requirePermission } = require('../../shared/permissions');

async function ticketPdfRoutes(fastify) {
  // Require JWT on all routes in this plugin (skip OPTIONS for CORS preflight)
  fastify.addHook('onRequest', async (request, reply) => {
    if (request.method === 'OPTIONS') return;
    await fastify.authenticate(request, reply);
  });

  // GET /tickets/:ticket_id/print/pdf — SALE_VIEW (print is a read/query operation)
  fastify.get(
    '/:ticket_id/print/pdf',
    { preHandler: [requirePermission('SALE_VIEW')] },
    async function (request, reply) {
      const ticketId = Number(request.params.ticket_id);
      if (!Number.isInteger(ticketId) || ticketId <= 0) {
        return reply.code(400).send({
          error: { code: 'INVALID_TICKET_ID', message: 'ticket_id must be a positive integer' },
        });
      }

      const { business_id } = request.user;

      let buffer;
      try {
        buffer = await pdfService.generateTicketPdf(ticketId, business_id);
      } catch (err) {
        // Known app errors (TICKET_NOT_FOUND 404, etc.) — rethrow to Fastify error handler
        if (err.statusCode) throw err;
        // Playwright or unexpected errors
        request.log.error(err, 'PDF render failed');
        const renderErr = new Error('Failed to generate PDF');
        renderErr.code = 'PDF_RENDER_FAILED';
        renderErr.statusCode = 500;
        throw renderErr;
      }

      return reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', `inline; filename="ticket-${ticketId}.pdf"`)
        .send(buffer);
    }
  );
}

module.exports = ticketPdfRoutes;
