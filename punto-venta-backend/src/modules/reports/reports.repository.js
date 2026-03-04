'use strict';

const { knex } = require('../../config/db');

function dateRange(from, to) {
  return {
    start: from ? `${from}T00:00:00.000Z` : null,
    end: to ? `${to}T23:59:59.999Z` : null,
  };
}

async function salesSummary(businessId, from, to) {
  const { start, end } = dateRange(from, to);

  const ticketQuery = knex('sale_ticket')
    .where({ business_id: businessId, estatus: 'CERRADO' });

  if (start) ticketQuery.where('closed_at', '>=', start);
  if (end) ticketQuery.where('closed_at', '<=', end);

  const ticketStats = await ticketQuery.clone()
    .select(
      knex.raw('count(*)::int as tickets_count'),
      knex.raw('coalesce(sum(total), 0) as gross_sales')
    )
    .first();

  // payments_total: sum of sale_payment.monto for those closed tickets
  const paymentQuery = knex('sale_payment as sp')
    .join('sale_ticket as st', function () {
      this.on('st.ticket_id', '=', 'sp.ticket_id')
        .andOn('st.business_id', '=', 'sp.business_id');
    })
    .where('st.business_id', businessId)
    .where('st.estatus', 'CERRADO');

  if (start) paymentQuery.where('st.closed_at', '>=', start);
  if (end) paymentQuery.where('st.closed_at', '<=', end);

  const paymentStats = await paymentQuery
    .select(knex.raw('coalesce(sum(sp.monto), 0) as payments_total'))
    .first();

  return {
    tickets_count: ticketStats.tickets_count,
    gross_sales: ticketStats.gross_sales,
    payments_total: paymentStats.payments_total,
  };
}

/* ── sales by day ────────────────────────────────────── */

async function salesByDay(businessId, from, to) {
  const { start, end } = dateRange(from, to);

  return knex('sale_ticket')
    .where({ business_id: businessId, estatus: 'CERRADO' })
    .where('closed_at', '>=', start)
    .where('closed_at', '<=', end)
    .select(
      knex.raw("date_trunc('day', closed_at)::date as date"),
      knex.raw('count(*)::int as tickets_count'),
      knex.raw('coalesce(sum(total), 0) as gross_sales')
    )
    .groupByRaw("date_trunc('day', closed_at)::date")
    .orderBy('date', 'asc');
}

/* ── top products ────────────────────────────────────── */

async function topProducts(businessId, from, to, limit) {
  const { start, end } = dateRange(from, to);

  return knex('sale_ticket_item as si')
    .join('sale_ticket as st', function () {
      this.on('st.ticket_id', '=', 'si.ticket_id')
        .andOn('st.business_id', '=', 'si.business_id');
    })
    .where('st.business_id', businessId)
    .where('st.estatus', 'CERRADO')
    .where('st.closed_at', '>=', start)
    .where('st.closed_at', '<=', end)
    .select(
      'si.product_id',
      'si.product_sku_snapshot as sku',
      'si.product_nombre_snapshot as nombre',
      knex.raw('sum(si.cantidad) as qty_sold'),
      knex.raw('sum(si.subtotal_linea) as gross_sales')
    )
    .groupBy('si.product_id', 'si.product_sku_snapshot', 'si.product_nombre_snapshot')
    .orderBy('gross_sales', 'desc')
    .limit(limit);
}

/* ── inventory summary ───────────────────────────────── */

async function inventorySummary(businessId, from, to) {
  const { start, end } = dateRange(from, to);

  const rows = await knex('inventory_movement')
    .where('business_id', businessId)
    .where('created_at', '>=', start)
    .where('created_at', '<=', end)
    .select(
      'tipo',
      knex.raw('sum(abs(qty_delta)) as total_qty')
    )
    .groupBy('tipo');

  const map = {};
  for (const r of rows) {
    map[r.tipo] = r.total_qty;
  }

  return {
    entries_qty: map['ENTRADA'] || '0.000',
    adjustments_qty: map['AJUSTE'] || '0.000',
    sales_qty: map['VENTA'] || '0.000',
  };
}

module.exports = {
  salesSummary,
  salesByDay,
  topProducts,
  inventorySummary,
};
