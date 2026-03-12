import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateProduct } from './productsApi'

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
