import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createEntry } from './inventoryApi'

export function useCreateEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createEntry,
    onSuccess: () => {
      // Refresh movements list + products (stock_actual changes)
      queryClient.invalidateQueries({ queryKey: ['inventory', 'movements'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
