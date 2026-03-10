'use strict';

const repo = require('./payment-methods.repository');
const { parse, createBody, patchBody } = require('./payment-methods.schemas');

function appError(code, message, statusCode) {
  const err = new Error(message);
  err.code = code;
  err.statusCode = statusCode;
  return err;
}

// ── GET /payment-methods ──────────────────────────────────────────────────────

async function listPaymentMethods() {
  const items = await repo.listPaymentMethods();
  return { items };
}

// ── POST /payment-methods ─────────────────────────────────────────────────────

async function createPaymentMethod(rawBody) {
  const body = parse(createBody, rawBody);

  const existing = await repo.findByCode(body.code);
  if (existing) {
    throw appError('PAYMENT_METHOD_CODE_EXISTS', `Code '${body.code}' already exists`, 409);
  }

  return repo.createPaymentMethod(body);
}

// ── PATCH /payment-methods/:payment_method_id ─────────────────────────────────

async function patchPaymentMethod(methodId, rawBody) {
  const body = parse(patchBody, rawBody);

  const existing = await repo.getById(methodId);
  if (!existing) throw appError('PAYMENT_METHOD_NOT_FOUND', 'Payment method not found', 404);

  const updates = {};
  if (body.nombre_visible     !== undefined) updates.nombre_visible     = body.nombre_visible;
  if (body.estatus            !== undefined) updates.estatus            = body.estatus;
  if (body.sort_order         !== undefined) updates.sort_order         = body.sort_order;
  if (body.requires_reference !== undefined) updates.requires_reference = body.requires_reference;

  return repo.patchPaymentMethod(methodId, updates);
}

// ── DELETE /payment-methods/:payment_method_id (soft) ─────────────────────────

async function deletePaymentMethod(methodId) {
  const existing = await repo.getById(methodId);
  if (!existing) throw appError('PAYMENT_METHOD_NOT_FOUND', 'Payment method not found', 404);

  if (existing.code === 'EFECTIVO') {
    throw appError('CANNOT_DISABLE_CASH', 'Cannot disable the EFECTIVO payment method', 409);
  }

  await repo.setEstatus(methodId, 'INACTIVO');
}

module.exports = { listPaymentMethods, createPaymentMethod, patchPaymentMethod, deletePaymentMethod };
