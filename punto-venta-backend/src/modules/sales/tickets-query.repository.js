'use strict';

const { knex } = require('../../config/db');

const TICKET_LIST_COLS = [
  'ticket_id', 'folio', 'estatus',
  'created_at', 'closed_at',
  'subtotal', 'impuestos_total', 'total', 'cambio',
];

const TICKET_DETAIL_COLS = [
  'ticket_id', 'folio', 'estatus',
  'created_at', 'closed_at',
  'subtotal', 'descuento_total', 'impuestos_total', 'total', 'cambio',
];

/**
 * Paginated list of tickets for a business with optional filters.
 * @param {number} businessId
 * @param {{ page: number, pageSize: number, estatus?: string, folio?: number, from?: string, to?: string }} opts
 * @returns {{ items: object[], total: number }}
 */
async function listTickets(businessId, { page, pageSize, estatus, folio, from, to }) {
  let query = knex('sale_ticket').where('business_id', businessId);

  if (estatus)       query = query.where('estatus', estatus);
  if (folio != null) query = query.where('folio', folio);
  if (from)          query = query.whereRaw('created_at::date >= ?::date', [from]);
  if (to)            query = query.whereRaw('created_at::date <= ?::date', [to]);

  const [{ count }] = await query.clone().count('* as count');

  const items = await query
    .select(TICKET_LIST_COLS)
    .orderBy('ticket_id', 'desc')
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return { items, total: Number(count) };
}

/**
 * Single ticket by id scoped to business.
 */
async function getTicketById(ticketId, businessId) {
  return knex('sale_ticket')
    .where({ ticket_id: ticketId, business_id: businessId })
    .select(TICKET_DETAIL_COLS)
    .first();
}

/**
 * Items for a ticket.
 */
async function getTicketItems(ticketId) {
  return knex('sale_ticket_item')
    .where('ticket_id', ticketId)
    .select(
      'item_id', 'product_id',
      'cantidad', 'precio_unitario', 'subtotal_linea',
      'product_sku_snapshot', 'product_nombre_snapshot'
    );
}

/**
 * Payments for a ticket joined with payment method name.
 */
async function getTicketPayments(ticketId) {
  return knex('sale_payment as sp')
    .join('payment_method as pm', 'pm.method_id', 'sp.method_id')
    .where('sp.ticket_id', ticketId)
    .select(
      'sp.payment_id',
      'pm.code as method_code',
      'pm.nombre_visible as method_name',
      'sp.monto',
      'sp.referencia'
    );
}

module.exports = { listTickets, getTicketById, getTicketItems, getTicketPayments };
