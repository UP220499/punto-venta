'use strict';

const repo = require('./reports.repository');

function toFixed2(val) {
  return Number(val).toFixed(2);
}

/* ── sales summary ───────────────────────────────────── */

async function salesSummary(businessId, from, to) {
  const data = await repo.salesSummary(businessId, from, to);
  const grossSales = Number(data.gross_sales);
  const count = data.tickets_count;
  const avgTicket = count > 0 ? (grossSales / count) : 0;

  return {
    from: from || null,
    to: to || null,
    tickets_count: count,
    gross_sales: toFixed2(data.gross_sales),
    payments_total: toFixed2(data.payments_total),
    avg_ticket: toFixed2(avgTicket),
  };
}

/* ── sales by day ────────────────────────────────────── */

async function salesByDay(businessId, from, to) {
  const rows = await repo.salesByDay(businessId, from, to);
  return {
    items: rows.map((r) => ({
      date: typeof r.date === 'string' ? r.date.slice(0, 10) : new Date(r.date).toISOString().slice(0, 10),
      tickets_count: r.tickets_count,
      gross_sales: toFixed2(r.gross_sales),
    })),
  };
}

/* ── top products ────────────────────────────────────── */

async function topProducts(businessId, from, to, limit) {
  const rows = await repo.topProducts(businessId, from, to, limit);
  return {
    items: rows.map((r) => ({
      product_id: Number(r.product_id),
      sku: r.sku,
      nombre: r.nombre,
      qty_sold: r.qty_sold,
      gross_sales: toFixed2(r.gross_sales),
    })),
  };
}

/* ── inventory summary ───────────────────────────────── */

async function inventorySummary(businessId, from, to) {
  return repo.inventorySummary(businessId, from, to);
}

module.exports = {
  salesSummary,
  salesByDay,
  topProducts,
  inventorySummary,
};
