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
