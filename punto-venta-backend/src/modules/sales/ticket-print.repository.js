'use strict';

const { knex } = require('../../config/db');

async function getSettings(businessId) {
  return knex('business_settings').where('business_id', businessId).first();
}

async function getTicket(ticketId, businessId) {
  return knex('sale_ticket')
    .where({ ticket_id: ticketId, business_id: businessId })
    .first();
}

async function getItems(ticketId) {
  return knex('sale_ticket_item')
    .where('ticket_id', ticketId)
    .select(
      'cantidad',
      'precio_unitario',
      'subtotal_linea',
      'product_sku_snapshot',
      'product_nombre_snapshot'
    );
}

async function getPayments(ticketId) {
  return knex('sale_payment as sp')
    .join('payment_method as pm', 'pm.method_id', 'sp.method_id')
    .where('sp.ticket_id', ticketId)
    .select('pm.code', 'pm.nombre_visible', 'sp.monto', 'sp.referencia');
}

async function getCashier(userId) {
  return knex('user')
    .where('user_id', userId)
    .select('nombre', 'username')
    .first();
}

module.exports = { getSettings, getTicket, getItems, getPayments, getCashier };
