import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { listAuditLogs } from './auditApi'

export function useAuditLogs({ page = 1, pageSize = 20, severity, eventCode, from, to } = {}) {
  const params = { page, page_size: pageSize }
  if (severity) params.severity = severity
  if (eventCode) params.event_code = eventCode
  if (from) params.from = from
  if (to) params.to = to

  return useQuery({
    queryKey: ['audit', params],
    queryFn: () => listAuditLogs(params),
    placeholderData: keepPreviousData,
  })
}
