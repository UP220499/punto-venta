import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPaymentMethod } from './paymentMethodsApi'

export function useCreatePaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createPaymentMethod,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-methods'] }),
  })
}
