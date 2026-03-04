'use strict';

const { knex } = require('../../config/db');
const repo = require('./products.repository');

function appError(code, message, statusCode) {
  const err = new Error(message);
  err.code = code;
  err.statusCode = statusCode;
  return err;
}

/* ── list ─────────────────────────────────────────────── */

async function listProducts(businessId, query) {
  const { items, total } = await repo.listProducts(businessId, query);
  return {
    items: items.map((p) => ({
      product_id: Number(p.product_id),
      sku: p.sku,
      nombre: p.nombre,
      precio_venta: p.precio_venta,
      stock_actual: p.stock_actual,
      stock_minimo: p.stock_minimo,
      unidad: p.unidad,
      estatus: p.estatus,
      primary_barcode: p.primary_barcode || null,
    })),
    page: query.page,
    page_size: query.page_size,
    total,
  };
}

/* ── create ───────────────────────────────────────────── */

async function createProduct(businessId, userId, data) {
  try {
    const row = await repo.insertProduct({
      business_id: businessId,
      created_by: userId,
      ...data,
    });
    return {
      product_id: Number(row.product_id),
      sku: row.sku,
      nombre: row.nombre,
      descripcion: row.descripcion,
      precio_venta: row.precio_venta,
      costo: row.costo,
      stock_actual: row.stock_actual,
      stock_minimo: row.stock_minimo,
      unidad: row.unidad,
      estatus: row.estatus,
      created_at: row.created_at,
    };
  } catch (err) {
    if (err.code === '23505' && err.constraint === 'product_business_id_sku_unique') {
      throw appError('SKU_ALREADY_EXISTS', `SKU '${data.sku}' already exists for this business`, 409);
    }
    throw err;
  }
}

/* ── update ───────────────────────────────────────────── */

async function updateProduct(businessId, productId, data) {
  const existing = await repo.findById(businessId, productId);
  if (!existing) {
    throw appError('PRODUCT_NOT_FOUND', 'Product not found', 404);
  }

  const row = await repo.updateProduct(businessId, productId, data);
  return {
    product_id: Number(row.product_id),
    sku: row.sku,
    nombre: row.nombre,
    descripcion: row.descripcion,
    precio_venta: row.precio_venta,
    costo: row.costo,
    stock_actual: row.stock_actual,
    stock_minimo: row.stock_minimo,
    unidad: row.unidad,
    estatus: row.estatus,
    updated_at: row.updated_at,
  };
}

/* ── add barcode ──────────────────────────────────────── */

async function addBarcode(businessId, productId, data) {
  const product = await repo.findById(businessId, productId);
  if (!product) {
    throw appError('PRODUCT_NOT_FOUND', 'Product not found', 404);
  }

  try {
    const row = await knex.transaction(async (trx) => {
      if (data.is_primary) {
        await repo.clearPrimaryBarcodes(trx, productId);
      }
      return repo.insertBarcode(trx, {
        business_id: businessId,
        product_id: productId,
        barcode_value: data.barcode_value,
        is_primary: data.is_primary,
      });
    });

    return {
      barcode_id: Number(row.barcode_id),
      product_id: Number(row.product_id),
      barcode_value: row.barcode_value,
      is_primary: row.is_primary,
    };
  } catch (err) {
    if (err.code === '23505') {
      if (err.constraint === 'product_barcode_business_id_barcode_value_unique') {
        throw appError('BARCODE_ALREADY_EXISTS', `Barcode '${data.barcode_value}' already exists in this business`, 409);
      }
      if (err.constraint === 'product_barcode_product_id_barcode_value_unique') {
        throw appError('BARCODE_ALREADY_EXISTS_FOR_PRODUCT', `Barcode '${data.barcode_value}' already exists for this product`, 409);
      }
      throw appError('BARCODE_ALREADY_EXISTS', 'Barcode already exists', 409);
    }
    throw err;
  }
}

/* ── lookup barcode ───────────────────────────────────── */

async function lookupBarcode(businessId, barcodeValue) {
  const row = await repo.findBarcodeByValue(businessId, barcodeValue);
  if (!row) {
    throw appError('BARCODE_NOT_FOUND', 'Barcode not found', 404);
  }
  return {
    product_id: Number(row.product_id),
    sku: row.sku,
    nombre: row.nombre,
    precio_venta: row.precio_venta,
    stock_actual: row.stock_actual,
    unidad: row.unidad,
    estatus: row.estatus,
    barcode_value: row.barcode_value,
    is_primary: row.is_primary,
  };
}

/* ── delete barcode ───────────────────────────────────── */

async function deleteBarcode(businessId, productId, barcodeId) {
  const product = await repo.findById(businessId, productId);
  if (!product) {
    throw appError('PRODUCT_NOT_FOUND', 'Product not found', 404);
  }

  const barcode = await repo.findBarcodeById(businessId, productId, barcodeId);
  if (!barcode) {
    throw appError('BARCODE_NOT_FOUND', 'Barcode not found', 404);
  }

  await repo.deleteBarcode(businessId, productId, barcodeId);
  return { deleted: true };
}

module.exports = {
  listProducts,
  createProduct,
  updateProduct,
  addBarcode,
  lookupBarcode,
  deleteBarcode,
};
