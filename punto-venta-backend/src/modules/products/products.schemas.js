'use strict';

const { z } = require('zod');

/* ── helpers ─────────────────────────────────────────── */

function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const msg = result.error.issues.map((i) => i.message).join('; ');
    const err = new Error(msg);
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
  return result.data;
}

/* ── query params ────────────────────────────────────── */

const listProductsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(20),
  q: z.string().trim().optional(),
  estatus: z.enum(['ACTIVO', 'INACTIVO']).optional(),
});

/* ── create product ──────────────────────────────────── */

const createProductBody = z.object({
  sku: z.string().trim().min(1).max(64),
  nombre: z.string().trim().min(1).max(160),
  descripcion: z.string().trim().max(500).nullish(),
  precio_venta: z.number().positive(),
  costo: z.number().min(0).nullish(),
  stock_actual: z.number().min(0).default(0),
  stock_minimo: z.number().min(0).default(0),
  unidad: z.string().trim().min(1).max(16).default('pz'),
});

/* ── update product ──────────────────────────────────── */

const updateProductBody = z.object({
  nombre: z.string().trim().min(1).max(160).optional(),
  descripcion: z.string().trim().max(500).nullish(),
  precio_venta: z.number().positive().optional(),
  costo: z.number().min(0).nullish(),
  stock_minimo: z.number().min(0).optional(),
  unidad: z.string().trim().min(1).max(16).optional(),
  estatus: z.enum(['ACTIVO', 'INACTIVO']).optional(),
});

/* ── barcode ─────────────────────────────────────────── */

const createBarcodeBody = z.object({
  barcode_value: z.string().trim().min(1).max(64),
  is_primary: z.boolean().default(false),
});

module.exports = {
  parse,
  listProductsQuery,
  createProductBody,
  updateProductBody,
  createBarcodeBody,
};
