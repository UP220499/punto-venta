import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updatePaymentMethod } from './paymentMethodsApi'

export function useUpdatePaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ paymentMethodId, ...body }) => updatePaymentMethod(paymentMethodId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-methods'] }),
  })
}
