import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { listMovements } from './inventoryApi'

export function useMovements({
  page = 1,
  pageSize = 20,
  productId = '',
  tipo = '',
  fromDate = '',
  toDate = '',
} = {}) {
  const params = { page, page_size: pageSize }
  if (productId) params.product_id = productId
  if (tipo) params.tipo = tipo
  // Backend expects ISO 8601 with timezone offset
  if (fromDate) params.from = `${fromDate}T00:00:00+00:00`
  if (toDate) params.to = `${toDate}T23:59:59+00:00`

  return useQuery({
    queryKey: ['inventory', 'movements', params],
    queryFn: () => listMovements(params),
    placeholderData: keepPreviousData,
  })
}
