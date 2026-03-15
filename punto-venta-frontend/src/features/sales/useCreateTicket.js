import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTicket } from './salesApi'

/**
 * Creates a ticket draft (POST /tickets).
 * In the next phase this will be called inside the payment flow:
 *   1. createTicket({ items }) → get ticket_id
 *   2. closeTicket(ticket_id, { payments }) → done
 *
 * Stock is only deducted on close, but we invalidate products for freshness.
 */
export function useCreateTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: () => {
      // Refresh product stock in case it changed since last fetch
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
