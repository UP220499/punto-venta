'use strict';

const { knex } = require('../../config/db');

const COLS = [
  'method_id', 'code', 'nombre_visible', 'estatus',
  'sort_order', 'requires_reference', 'allows_change',
];

function mapMethod(row) {
  return {
    payment_method_id:  row.method_id,
    code:               row.code,
    nombre_visible:     row.nombre_visible,
    estatus:            row.estatus,
    sort_order:         row.sort_order,
    requires_reference: row.requires_reference,
    allows_change:      row.allows_change,
  };
}

async function listPaymentMethods() {
  const rows = await knex('payment_method')
    .select(COLS)
    .orderBy([
      { column: 'sort_order',     order: 'asc' },
      { column: 'nombre_visible', order: 'asc' },
    ]);
  return rows.map(mapMethod);
}

async function findByCode(code) {
  return knex('payment_method').where({ code }).first();
}

async function getById(methodId) {
  const row = await knex('payment_method')
    .where({ method_id: methodId })
    .select(COLS)
    .first();
  return row ? mapMethod(row) : null;
}

async function createPaymentMethod({ code, nombre_visible, sort_order, requires_reference }) {
  const [row] = await knex('payment_method')
    .insert({ code, nombre_visible, sort_order, requires_reference, estatus: 'ACTIVO' })
    .returning(COLS);
  return mapMethod(row);
}

async function patchPaymentMethod(methodId, updates) {
  const [row] = await knex('payment_method')
    .where({ method_id: methodId })
    .update(updates)
    .returning(COLS);
  return row ? mapMethod(row) : null;
}

async function setEstatus(methodId, estatus) {
  await knex('payment_method').where({ method_id: methodId }).update({ estatus });
}

module.exports = {
  listPaymentMethods,
  findByCode,
  getById,
  createPaymentMethod,
  patchPaymentMethod,
  setEstatus,
};
