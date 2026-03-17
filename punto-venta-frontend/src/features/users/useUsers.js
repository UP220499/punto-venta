import { useQuery } from '@tanstack/react-query'
import { listUsers } from './usersApi'

export function useUsers({ page, pageSize, q, activo }) {
  return useQuery({
    queryKey: ['users', { page, pageSize, q, activo }],
    queryFn: () => listUsers({ page, pageSize, q, activo }),
    placeholderData: (prev) => prev,
  })
}
