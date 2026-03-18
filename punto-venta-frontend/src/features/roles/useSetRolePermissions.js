import { useMutation, useQueryClient } from '@tanstack/react-query'
import { setRolePermissions } from './rolesApi'

export function useSetRolePermissions() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ roleId, permissionCodes }) =>
      setRolePermissions(roleId, permissionCodes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  })
}
