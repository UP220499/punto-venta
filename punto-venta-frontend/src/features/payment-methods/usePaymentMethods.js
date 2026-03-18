import { useQuery } from '@tanstack/react-query'
import { listPaymentMethods } from './paymentMethodsApi'

export function usePaymentMethods() {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: listPaymentMethods,
  })
}
