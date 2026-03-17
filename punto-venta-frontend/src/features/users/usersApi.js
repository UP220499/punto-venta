import api from '../../lib/axios'

export async function listUsers({ page, pageSize, q, activo }) {
  const params = { page, page_size: pageSize }
  if (q) params.q = q
  if (activo !== '') params.activo = activo
  const { data } = await api.get('/users', { params })
  return data
}

export async function createUser(body) {
  const { data } = await api.post('/users', body)
  return data
}

export async function updateUser(userId, body) {
  const { data } = await api.patch(`/users/${userId}`, body)
  return data
}

export async function setUserRoles(userId, roleCodes) {
  const { data } = await api.put(`/users/${userId}/roles`, { role_codes: roleCodes })
  return data
}
