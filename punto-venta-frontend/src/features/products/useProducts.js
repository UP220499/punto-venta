import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { listProducts } from './productsApi'

export function useProducts({ page = 1, pageSize = 20, q = '', estatus = '' } = {}) {
  const params = { page, page_size: pageSize }
  if (q) params.q = q
  if (estatus) params.estatus = estatus

  return useQuery({
    queryKey: ['products', params],
    queryFn: () => listProducts(params),
    placeholderData: keepPreviousData,
  })
}
