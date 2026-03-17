import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createUser } from './usersApi'

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}
