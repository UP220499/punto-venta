import api from '../../lib/axios'

/**
 * POST /tickets
 * Body: { items: [{ product_id, cantidad }] }
 * Response: { ticket_id, estatus: 'BORRADOR', subtotal, total, items: [...] }
 */
export async function createTicket(body) {
  const { data } = await api.post('/tickets', body)
  return data
}

/**
 * POST /tickets/:ticket_id/close
 * Body: { payments: [{ method_code, monto, referencia? }] }
 * Response: { ticket_id, folio, estatus: 'CERRADO', total, cambio, closed_at, ... }
 */
export async function closeTicket(ticketId, body) {
  const { data } = await api.post(`/tickets/${ticketId}/close`, body)
  return data
}

/**
 * GET /payment-methods
 * Response: { items: [{ payment_method_id, code, nombre_visible, estatus, sort_order, requires_reference, allows_change }] }
 */
export async function listPaymentMethods() {
  const { data } = await api.get('/payment-methods')
  return data
}

/**
 * GET /tickets
 * Query: { page?, page_size?, estatus?: 'BORRADOR'|'CERRADO', folio?: number, from?: 'yyyy-mm-dd', to?: 'yyyy-mm-dd' }
 * Response: { items: [{ ticket_id, folio, estatus, created_at, closed_at, subtotal, impuestos_total, total, cambio }], page, page_size, total }
 */
export async function listTickets(params) {
  const { data } = await api.get('/tickets', { params })
  return data
}

/**
 * GET /tickets/:ticket_id
 * Response: { ticket: { ticket_id, folio, estatus, created_at, closed_at, subtotal, descuento_total, impuestos_total, total, cambio },
 *             items:   [{ item_id, product_id, cantidad, precio_unitario, subtotal_linea, product_sku_snapshot, product_nombre_snapshot }],
 *             payments:[{ payment_id, method_code, method_name, monto, referencia }] }
 */
export async function getTicket(ticketId) {
  const { data } = await api.get(`/tickets/${ticketId}`)
  return data
}
