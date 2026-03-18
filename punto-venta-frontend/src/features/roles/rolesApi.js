import api from '../../lib/axios'

export async function listRoles() {
  const { data } = await api.get('/roles')
  return data
}

export async function listPermissions() {
  const { data } = await api.get('/roles/permissions')
  return data
}

export async function setRolePermissions(roleId, permissionCodes) {
  const { data } = await api.put(`/roles/${roleId}/permissions`, {
    permission_codes: permissionCodes,
  })
  return data
}
