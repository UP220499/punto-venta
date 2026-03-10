'use strict';

const { knex } = require('../../config/db');
const repo = require('./tickets.repository');

function appError(code, message, statusCode) {
  const err = new Error(message);
  err.code = code;
  err.statusCode = statusCode;
  return err;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/* ────────────────────── POST /tickets ────────────────────── */

async function createTicket(businessId, userId, items) {
  const productIds = items.map((i) => i.product_id);

  const products = await repo.findProductsByIds(businessId, productIds);
  const productMap = new Map(products.map((p) => [Number(p.product_id), p]));

  // Validate every requested product exists in this business
  for (const item of items) {
    if (!productMap.has(item.product_id)) {
      throw appError('PRODUCT_NOT_FOUND', `Product not found: product_id=${item.product_id}`, 404);
    }
  }

  // Build line items
  const lineItems = items.map((item) => {
    const prod = productMap.get(item.product_id);
    const precio = Number(prod.precio_venta);
    const subtotalLinea = round2(item.cantidad * precio);
    return {
      product_id: item.product_id,
      cantidad: item.cantidad,
      precio_unitario: precio,
      subtotal_linea: subtotalLinea,
      product_sku_snapshot: prod.sku,
      product_nombre_snapshot: prod.nombre,
    };
  });

  const subtotal = round2(lineItems.reduce((s, l) => s + l.subtotal_linea, 0));

  // Insert inside a transaction
  const result = await knex.transaction(async (trx) => {
    const ticket = await repo.insertTicket(trx, {
      business_id: businessId,
      created_by: userId,
      subtotal,
      total: subtotal,
    });

    const itemRows = lineItems.map((l) => ({
      business_id: businessId,
      ticket_id: ticket.ticket_id,
      ...l,
    }));

    const insertedItems = await repo.insertTicketItems(trx, itemRows);

    return { ticket, items: insertedItems };
  });

  return {
    ticket_id: Number(result.ticket.ticket_id),
    estatus: result.ticket.estatus,
    subtotal: result.ticket.subtotal,
    total: result.ticket.total,
    items: result.items.map((i) => ({
      item_id: Number(i.item_id),
      product_id: Number(i.product_id),
      cantidad: i.cantidad,
      precio_unitario: i.precio_unitario,
      subtotal_linea: i.subtotal_linea,
      product_sku_snapshot: i.product_sku_snapshot,
      product_nombre_snapshot: i.product_nombre_snapshot,
    })),
  };
}

/* ────────────────────── POST /tickets/:id/close ────────────────────── */

async function closeTicket(businessId, userId, ticketId, payments) {
  // 1. Resolve payment method codes upfront
  const methodCodes = payments.map((p) => p.method_code);
  const methods = await repo.findPaymentMethodsByCodes(methodCodes);
  const methodMap = new Map(methods.map((m) => [m.code, m]));

  for (const p of payments) {
    if (!methodMap.has(p.method_code)) {
      throw appError('VALIDATION_ERROR', `Unknown payment method: ${p.method_code}`, 400);
    }
  }

  // 2. Transactional close
  const closed = await knex.transaction(async (trx) => {
    // 2a. Lock ticket and validate current status
    const ticket = await repo.findTicketByIdForUpdate(trx, ticketId, businessId);
    if (!ticket) throw appError('TICKET_NOT_FOUND', 'Ticket not found', 404);
    if (ticket.estatus !== 'BORRADOR') {
      throw appError('TICKET_NOT_DRAFT', 'Ticket is not a draft', 409);
    }

    // 2b. Load ticket items inside transaction
    const ticketItems = await repo.findTicketItems(ticketId, trx);

    // 2c. Lock products and validate stock
    const productIds = ticketItems.map((i) => Number(i.product_id));
    const lockedProducts = await repo.lockProducts(trx, businessId, productIds);
    const prodMap = new Map(lockedProducts.map((p) => [Number(p.product_id), p]));

    for (const item of ticketItems) {
      const prod = prodMap.get(Number(item.product_id));
      if (Number(prod.stock_actual) < Number(item.cantidad)) {
        throw appError(
          'STOCK_INSUFFICIENT',
          `Insufficient stock for product_id=${item.product_id}`,
          409
        );
      }
    }

    // 2d. Lock business_settings, assign folio
    const settings = await repo.lockBusinessSettings(trx, businessId);
    const folio = Number(settings.ticket_folio_next);
    await repo.incrementFolioNext(trx, businessId);

    // 2e. Validate payment sum
    const total = Number(ticket.total);
    const sumPagos = round2(payments.reduce((s, p) => s + p.monto, 0));
    if (sumPagos < total) {
      throw appError('PAYMENT_INSUFFICIENT', `Payment sum ${sumPagos} < total ${total}`, 400);
    }
    const cambio = round2(sumPagos - total);
    // NOTE: cambio is allowed even if no EFECTIVO method present — simplification

    // 2f. Conditionally close ticket only if it is still BORRADOR
    // (extra guard for concurrent close attempts).
    const updated = await repo.updateTicketCloseIfDraft(trx, ticketId, businessId, {
      estatus: 'CERRADO',
      folio,
      closed_at: knex.fn.now(),
      cambio,
    });
    if (!updated) {
      throw appError('TICKET_NOT_DRAFT', 'Ticket is not a draft', 409);
    }

    // 2g. Insert sale_payment rows (only after conditional close succeeds)
    const paymentRows = payments.map((p) => ({
      business_id: businessId,
      ticket_id: ticketId,
      method_id: methodMap.get(p.method_code).method_id,
      monto: p.monto,
      referencia: p.referencia || null,
      created_by: userId,
    }));
    await repo.insertPayments(trx, paymentRows);

    // 2h. Deduct stock + insert inventory movements
    const movementRows = [];
    for (const item of ticketItems) {
      await repo.updateProductStock(trx, item.product_id, Number(item.cantidad));
      movementRows.push({
        business_id: businessId,
        product_id: item.product_id,
        tipo: 'VENTA',
        qty_delta: -Number(item.cantidad),
        ref_type: 'TICKET',
        ref_id: ticketId,
        created_by: userId,
      });
    }
    await repo.insertInventoryMovements(trx, movementRows);

    return updated;
  });

  // 3. Audit (outside transaction — must not cause rollback)
  await repo.insertAuditLog({
    business_id: businessId,
    event_code: 'TICKET_CLOSED',
    severity: 'INFO',
    actor_user_id: userId,
    source: 'API',
    entity_type: 'sale_ticket',
    entity_id: ticketId,
    message: `Ticket #${closed.folio} closed — total ${closed.total}`,
    metadata: JSON.stringify({
      ticket_id: ticketId,
      folio: Number(closed.folio),
      total: closed.total,
    }),
  });

  return {
    ticket_id: Number(closed.ticket_id),
    folio: Number(closed.folio),
    estatus: closed.estatus,
    subtotal: closed.subtotal,
    descuento_total: closed.descuento_total,
    impuestos_total: closed.impuestos_total,
    total: closed.total,
    cambio: closed.cambio,
    closed_at: closed.closed_at,
  };
}

module.exports = { createTicket, closeTicket };
