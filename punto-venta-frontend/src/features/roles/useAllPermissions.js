import { useQuery } from '@tanstack/react-query'
import { listPermissions } from './rolesApi'

export function useAllPermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: listPermissions,
  })
}
