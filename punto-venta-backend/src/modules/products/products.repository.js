'use strict';

const { knex } = require('../../config/db');

/* ── list products (paginated) ───────────────────────── */

async function listProducts(businessId, { page, page_size, q, estatus }) {
  const base = knex('product')
    .where('product.business_id', businessId);

  if (q) {
    base.where(function () {
      this.where('product.sku', 'ilike', `%${q}%`)
        .orWhere('product.nombre', 'ilike', `%${q}%`);
    });
  }

  if (estatus) {
    base.where('product.estatus', estatus);
  }

  const countQuery = base.clone().count('* as total').first();

  const itemsQuery = base.clone()
    .select(
      'product.product_id',
      'product.sku',
      'product.nombre',
      'product.precio_venta',
      'product.stock_actual',
      'product.stock_minimo',
      'product.unidad',
      'product.estatus',
      'pb.barcode_value as primary_barcode'
    )
    .leftJoin('product_barcode as pb', function () {
      this.on('pb.product_id', '=', 'product.product_id')
        .andOn('pb.is_primary', '=', knex.raw('true'));
    })
    .orderBy('product.product_id', 'desc')
    .limit(page_size)
    .offset((page - 1) * page_size);

  const [countResult, items] = await Promise.all([countQuery, itemsQuery]);

  return {
    items,
    total: Number(countResult.total),
  };
}

/* ── find by id ──────────────────────────────────────── */

async function findById(businessId, productId) {
  return knex('product')
    .where({ business_id: businessId, product_id: productId })
    .first();
}

/* ── insert product ──────────────────────────────────── */

async function insertProduct(data) {
  const [row] = await knex('product').insert(data).returning('*');
  return row;
}

/* ── update product ──────────────────────────────────── */

async function updateProduct(businessId, productId, data) {
  const [row] = await knex('product')
    .where({ business_id: businessId, product_id: productId })
    .update({ ...data, updated_at: knex.fn.now() })
    .returning('*');
  return row;
}

/* ── barcodes ────────────────────────────────────────── */

async function findBarcodeByValue(businessId, barcodeValue) {
  return knex('product_barcode as pb')
    .join('product as p', 'p.product_id', 'pb.product_id')
    .where('pb.business_id', businessId)
    .where('pb.barcode_value', barcodeValue)
    .select(
      'p.product_id',
      'p.sku',
      'p.nombre',
      'p.precio_venta',
      'p.stock_actual',
      'p.unidad',
      'p.estatus',
      'pb.barcode_value',
      'pb.is_primary'
    )
    .first();
}

async function insertBarcode(trx, data) {
  const conn = trx || knex;
  const [row] = await conn('product_barcode').insert(data).returning('*');
  return row;
}

async function clearPrimaryBarcodes(trx, productId) {
  await trx('product_barcode')
    .where({ product_id: productId, is_primary: true })
    .update({ is_primary: false });
}

async function findBarcodeById(businessId, productId, barcodeId) {
  return knex('product_barcode')
    .where({ business_id: businessId, product_id: productId, barcode_id: barcodeId })
    .first();
}

async function deleteBarcode(businessId, productId, barcodeId) {
  return knex('product_barcode')
    .where({ business_id: businessId, product_id: productId, barcode_id: barcodeId })
    .del();
}

module.exports = {
  listProducts,
  findById,
  insertProduct,
  updateProduct,
  findBarcodeByValue,
  insertBarcode,
  clearPrimaryBarcodes,
  findBarcodeById,
  deleteBarcode,
};
