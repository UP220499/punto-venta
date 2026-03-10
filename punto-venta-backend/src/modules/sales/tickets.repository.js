'use strict';

const { knex } = require('../../config/db');

/* ── Read helpers (no transaction needed) ── */

async function findProductsByIds(businessId, productIds, trx) {
  const conn = trx || knex;
  return conn('product')
    .where('business_id', businessId)
    .whereIn('product_id', productIds);
}

async function findPaymentMethodsByCodes(codes, trx) {
  const conn = trx || knex;
  return conn('payment_method').whereIn('code', codes);
}

async function findTicketByIdForUpdate(trx, ticketId, businessId) {
  return trx('sale_ticket')
    .where({ ticket_id: ticketId, business_id: businessId })
    .forUpdate()
    .first();
}

async function findTicketItems(ticketId, trx) {
  const conn = trx || knex;
  return conn('sale_ticket_item').where('ticket_id', ticketId);
}

/* ── Locking helpers (require trx) ── */

async function lockProducts(trx, businessId, productIds) {
  return trx('product')
    .where('business_id', businessId)
    .whereIn('product_id', productIds)
    .forUpdate();
}

async function lockBusinessSettings(trx, businessId) {
  return trx('business_settings')
    .where('business_id', businessId)
    .forUpdate()
    .first();
}

/* ── Write helpers ── */

async function insertTicket(trx, data) {
  const [row] = await trx('sale_ticket').insert(data).returning('*');
  return row;
}

async function insertTicketItems(trx, rows) {
  return trx('sale_ticket_item').insert(rows).returning('*');
}

async function insertPayments(trx, rows) {
  return trx('sale_payment').insert(rows).returning('*');
}

async function insertInventoryMovements(trx, rows) {
  return trx('inventory_movement').insert(rows);
}

async function updateProductStock(trx, productId, cantidad) {
  await trx('product')
    .where('product_id', productId)
    .decrement('stock_actual', cantidad);
}

async function updateTicketCloseIfDraft(trx, ticketId, businessId, data) {
  const [row] = await trx('sale_ticket')
    .where({ ticket_id: ticketId, business_id: businessId, estatus: 'BORRADOR' })
    .update(data)
    .returning('*');
  return row;
}

async function incrementFolioNext(trx, businessId) {
  await trx('business_settings')
    .where('business_id', businessId)
    .increment('ticket_folio_next', 1);
}

async function insertAuditLog(data) {
  try {
    await knex('audit_log').insert(data);
  } catch (err) {
    // Audit must not break the flow — log and move on
    console.error('Audit log insert failed:', err.message);
  }
}

module.exports = {
  findProductsByIds,
  findPaymentMethodsByCodes,
  findTicketByIdForUpdate,
  findTicketItems,
  lockProducts,
  lockBusinessSettings,
  insertTicket,
  insertTicketItems,
  insertPayments,
  insertInventoryMovements,
  updateProductStock,
  updateTicketCloseIfDraft,
  incrementFolioNext,
  insertAuditLog,
};
