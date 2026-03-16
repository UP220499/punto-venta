import { useQuery } from '@tanstack/react-query'
import { getTicket } from './salesApi'

export function useTicketDetail(ticketId) {
  return useQuery({
    queryKey: ['tickets', 'detail', ticketId],
    queryFn: () => getTicket(ticketId),
    enabled: ticketId != null,
  })
}
