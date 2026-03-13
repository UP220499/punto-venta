import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createAdjustment } from './inventoryApi'

export function useCreateAdjustment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAdjustment,
    onSuccess: () => {
      // Refresh movements list + products (stock_actual changes)
      queryClient.invalidateQueries({ queryKey: ['inventory', 'movements'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: () => {
      // Refresh products so the live stock preview reflects reality after a
      // backend rejection (e.g. 422 INSUFFICIENT_STOCK due to race condition)
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
