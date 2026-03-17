import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateUser } from './usersApi'

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, ...body }) => updateUser(userId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}
