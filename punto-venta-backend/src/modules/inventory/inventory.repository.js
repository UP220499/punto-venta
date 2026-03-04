'use strict';

const { knex } = require('../../config/db');

/* ── lock product FOR UPDATE ─────────────────────────── */

async function lockProduct(trx, businessId, productId) {
  return trx('product')
    .where({ business_id: businessId, product_id: productId })
    .forUpdate()
    .first();
}

/* ── update stock ────────────────────────────────────── */

async function updateStock(trx, productId, newStock) {
  await trx('product')
    .where('product_id', productId)
    .update({ stock_actual: newStock, updated_at: knex.fn.now() });
}

/* ── insert movement ─────────────────────────────────── */

async function insertMovement(trx, data) {
  const [row] = await trx('inventory_movement').insert(data).returning('*');
  return row;
}

/* ── list movements (paginated) ──────────────────────── */

async function listMovements(businessId, { page, page_size, product_id, tipo, from, to }) {
  const base = knex('inventory_movement').where('business_id', businessId);

  if (product_id) base.where('product_id', product_id);
  if (tipo) base.where('tipo', tipo);
  if (from) base.where('created_at', '>=', from);
  if (to) base.where('created_at', '<=', to);

  const countQuery = base.clone().count('* as total').first();

  const itemsQuery = base.clone()
    .select(
      'movement_id', 'product_id', 'tipo', 'qty_delta',
      'ref_type', 'ref_id', 'nota', 'created_by', 'created_at'
    )
    .orderBy('created_at', 'desc')
    .limit(page_size)
    .offset((page - 1) * page_size);

  const [countResult, items] = await Promise.all([countQuery, itemsQuery]);

  return { items, total: Number(countResult.total) };
}

/* ── low stock ───────────────────────────────────────── */

async function findLowStock(businessId, threshold) {
  const query = knex('product')
    .where('business_id', businessId)
    .where('estatus', 'ACTIVO');

  if (threshold > 0) {
    query.where(function () {
      this.whereRaw('stock_actual <= stock_minimo')
        .orWhereRaw('stock_actual <= ?', [threshold]);
    });
  } else {
    query.whereRaw('stock_actual <= stock_minimo');
  }

  return query
    .select('product_id', 'sku', 'nombre', 'stock_actual', 'stock_minimo', 'unidad')
    .orderBy('product_id', 'asc');
}

module.exports = {
  lockProduct,
  updateStock,
  insertMovement,
  listMovements,
  findLowStock,
};
