import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTicket, closeTicket } from './salesApi'

/**
 * Atomic POS checkout: POST /tickets → POST /tickets/:id/close
 *
 * mutationFn input:
 *   {
 *     items:   [{ product_id: number, cantidad: number }]
 *     payment: { method_code: string, monto: number, referencia?: string }
 *   }
 *
 * Returns the close response:
 *   { ticket_id, folio, estatus: 'CERRADO', subtotal, total, cambio, closed_at }
 *
 * Note: stock is only validated (and deducted) during /close, not during /tickets.
 * If /close fails, the BORRADOR ticket is abandoned (harmless — no stock affected).
 */
export function useCheckout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ items, payment }) => {
      const ticket = await createTicket({ items })
      return closeTicket(ticket.ticket_id, { payments: [payment] })
    },
    onSuccess: () => {
      // Refresh product stock so the search panel reflects the sold quantities
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: () => {
      // Refresh stock in case backend updated inventory before rejecting (race condition)
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
