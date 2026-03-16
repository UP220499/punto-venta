import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { listTickets } from './salesApi'

export function useTickets({ page = 1, pageSize = 20, estatus = '', folio = '', from = '', to = '' } = {}) {
  const params = { page, page_size: pageSize }
  if (estatus) params.estatus = estatus
  if (folio) params.folio = parseInt(folio, 10)
  if (from) params.from = from   // yyyy-mm-dd
  if (to) params.to = to         // yyyy-mm-dd

  return useQuery({
    queryKey: ['tickets', params],
    queryFn: () => listTickets(params),
    placeholderData: keepPreviousData,
  })
}
