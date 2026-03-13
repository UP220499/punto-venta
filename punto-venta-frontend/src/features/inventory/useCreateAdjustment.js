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
  })
}
