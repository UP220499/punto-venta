import { useQuery } from '@tanstack/react-query'
import { listRoles } from './rolesApi'

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: listRoles,
  })
}
