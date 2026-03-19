'use strict';

const { knex } = require('../../config/db');

async function getBusinessTimezone(businessId) {
  const row = await knex('business_settings')
    .where({ business_id: businessId })
    .select('timezone')
    .first();
  return (row && row.timezone) || 'UTC';
}

async function salesSummary(businessId, from, to) {
  const tz = await getBusinessTimezone(businessId);

  const ticketQuery = knex('sale_ticket')
    .where({ business_id: businessId, estatus: 'CERRADO' });

  if (from) ticketQuery.whereRaw('(closed_at AT TIME ZONE ?)::date >= ?', [tz, from]);
  if (to)   ticketQuery.whereRaw('(closed_at AT TIME ZONE ?)::date <= ?', [tz, to]);

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

  if (from) paymentQuery.whereRaw('(st.closed_at AT TIME ZONE ?)::date >= ?', [tz, from]);
  if (to)   paymentQuery.whereRaw('(st.closed_at AT TIME ZONE ?)::date <= ?', [tz, to]);

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
  const tz = await getBusinessTimezone(businessId);

  return knex('sale_ticket')
    .where({ business_id: businessId, estatus: 'CERRADO' })
    .whereRaw('(closed_at AT TIME ZONE ?)::date >= ?', [tz, from])
    .whereRaw('(closed_at AT TIME ZONE ?)::date <= ?', [tz, to])
    .select(
      knex.raw('(closed_at AT TIME ZONE ?)::date as date', [tz]),
      knex.raw('count(*)::int as tickets_count'),
      knex.raw('coalesce(sum(total), 0) as gross_sales')
    )
    .groupByRaw('(closed_at AT TIME ZONE ?)::date', [tz])
    .orderByRaw('(closed_at AT TIME ZONE ?)::date asc', [tz]);
}

/* ── top products ────────────────────────────────────── */

async function topProducts(businessId, from, to, limit) {
  const tz = await getBusinessTimezone(businessId);

  return knex('sale_ticket_item as si')
    .join('sale_ticket as st', function () {
      this.on('st.ticket_id', '=', 'si.ticket_id')
        .andOn('st.business_id', '=', 'si.business_id');
    })
    .where('st.business_id', businessId)
    .where('st.estatus', 'CERRADO')
    .whereRaw('(st.closed_at AT TIME ZONE ?)::date >= ?', [tz, from])
    .whereRaw('(st.closed_at AT TIME ZONE ?)::date <= ?', [tz, to])
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
  const tz = await getBusinessTimezone(businessId);

  const rows = await knex('inventory_movement')
    .where('business_id', businessId)
    .whereRaw('(created_at AT TIME ZONE ?)::date >= ?', [tz, from])
    .whereRaw('(created_at AT TIME ZONE ?)::date <= ?', [tz, to])
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
