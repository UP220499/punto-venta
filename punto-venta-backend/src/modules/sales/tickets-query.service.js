'use strict';

const repo = require('./tickets-query.repository');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const VALID_ESTATUS = new Set(['BORRADOR', 'CERRADO']);

function appError(code, message, statusCode) {
  const err = new Error(message);
  err.code = code;
  err.statusCode = statusCode;
  return err;
}

/* ── GET /tickets ── */

async function listTickets(businessId, rawQuery) {
  const page     = Math.max(1, Number(rawQuery.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(rawQuery.page_size) || 20));

  const estatus = rawQuery.estatus || null;
  if (estatus && !VALID_ESTATUS.has(estatus)) {
    throw appError('VALIDATION_ERROR', 'estatus must be BORRADOR or CERRADO', 400);
  }

  let folio = null;
  if (rawQuery.folio != null && rawQuery.folio !== '') {
    folio = Number(rawQuery.folio);
    if (!Number.isInteger(folio) || folio < 1) {
      throw appError('VALIDATION_ERROR', 'folio must be a positive integer', 400);
    }
  }

  const from = rawQuery.from || null;
  const to   = rawQuery.to   || null;
  if (from && !DATE_RE.test(from)) throw appError('VALIDATION_ERROR', 'from must be yyyy-mm-dd', 400);
  if (to   && !DATE_RE.test(to))   throw appError('VALIDATION_ERROR', 'to must be yyyy-mm-dd', 400);

  const { items, total } = await repo.listTickets(businessId, { page, pageSize, estatus, folio, from, to });

  return { items, page, page_size: pageSize, total };
}

/* ── GET /tickets/:ticket_id ── */

async function getTicketDetail(ticketId, businessId) {
  const ticket = await repo.getTicketById(ticketId, businessId);
  if (!ticket) throw appError('TICKET_NOT_FOUND', 'Ticket not found', 404);

  const [items, payments] = await Promise.all([
    repo.getTicketItems(ticketId),
    repo.getTicketPayments(ticketId),
  ]);

  return { ticket, items, payments };
}

module.exports = { listTickets, getTicketDetail };
