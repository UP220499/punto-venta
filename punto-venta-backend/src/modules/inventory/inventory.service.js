'use strict';

const { knex } = require('../../config/db');
const repo = require('./inventory.repository');

function appError(code, message, statusCode) {
  const err = new Error(message);
  err.code = code;
  err.statusCode = statusCode;
  return err;
}

function round3(n) {
  return Math.round(n * 1000) / 1000;
}

/* ── entries (stock in) ──────────────────────────────── */

async function applyEntries(businessId, userId, items) {
  const results = await knex.transaction(async (trx) => {
    const applied = [];

    for (const item of items) {
      const product = await repo.lockProduct(trx, businessId, item.product_id);
      if (!product) {
        throw appError('PRODUCT_NOT_FOUND', `Product not found: product_id=${item.product_id}`, 404);
      }

      const prevStock = Number(product.stock_actual);
      const newStock = round3(prevStock + item.cantidad);

      await repo.insertMovement(trx, {
        business_id: businessId,
        product_id: item.product_id,
        tipo: 'ENTRADA',
        qty_delta: item.cantidad,
        ref_type: 'ENTRADA',
        ref_id: null,
        nota: item.nota || null,
        created_by: userId,
      });

      await repo.updateStock(trx, item.product_id, newStock);

      applied.push({
        product_id: Number(item.product_id),
        prev_stock: prevStock,
        new_stock: newStock,
        qty_delta: item.cantidad,
      });
    }

    return applied;
  });

  return { applied: results.length, items: results };
}

/* ── adjustments (+ or -) ────────────────────────────── */

async function applyAdjustments(businessId, userId, items) {
  const results = await knex.transaction(async (trx) => {
    const applied = [];

    for (const item of items) {
      const product = await repo.lockProduct(trx, businessId, item.product_id);
      if (!product) {
        throw appError('PRODUCT_NOT_FOUND', `Product not found: product_id=${item.product_id}`, 404);
      }

      const prevStock = Number(product.stock_actual);
      const newStock = round3(prevStock + item.qty_delta);

      if (newStock < 0) {
        throw appError(
          'STOCK_NEGATIVE_NOT_ALLOWED',
          `Adjustment would leave product_id=${item.product_id} with negative stock (${prevStock} + ${item.qty_delta} = ${newStock})`,
          409
        );
      }

      await repo.insertMovement(trx, {
        business_id: businessId,
        product_id: item.product_id,
        tipo: 'AJUSTE',
        qty_delta: item.qty_delta,
        ref_type: 'AJUSTE',
        ref_id: null,
        nota: item.nota,
        created_by: userId,
      });

      await repo.updateStock(trx, item.product_id, newStock);

      applied.push({
        product_id: Number(item.product_id),
        prev_stock: prevStock,
        new_stock: newStock,
        qty_delta: item.qty_delta,
      });
    }

    return applied;
  });

  return { applied: results.length, items: results };
}

/* ── list movements ──────────────────────────────────── */

async function listMovements(businessId, query) {
  const { items, total } = await repo.listMovements(businessId, query);
  return {
    items: items.map((m) => ({
      movement_id: Number(m.movement_id),
      product_id: Number(m.product_id),
      tipo: m.tipo,
      qty_delta: m.qty_delta,
      ref_type: m.ref_type,
      ref_id: m.ref_id ? Number(m.ref_id) : null,
      nota: m.nota,
      created_by: Number(m.created_by),
      created_at: m.created_at,
    })),
    page: query.page,
    page_size: query.page_size,
    total,
  };
}

/* ── low stock ───────────────────────────────────────── */

async function getLowStock(businessId, threshold) {
  const rows = await repo.findLowStock(businessId, threshold);
  return rows.map((p) => ({
    product_id: Number(p.product_id),
    sku: p.sku,
    nombre: p.nombre,
    stock_actual: p.stock_actual,
    stock_minimo: p.stock_minimo,
    unidad: p.unidad,
  }));
}

module.exports = {
  applyEntries,
  applyAdjustments,
  listMovements,
  getLowStock,
};
