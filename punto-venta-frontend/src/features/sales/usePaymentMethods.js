import { useQuery } from '@tanstack/react-query'
import { listPaymentMethods } from './salesApi'

export function usePaymentMethods() {
  return useQuery({
    queryKey: ['paymentMethods'],
    queryFn: listPaymentMethods,
    staleTime: 5 * 60 * 1000, // methods rarely change
  })
}
