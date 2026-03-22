import api from '../../lib/axios'

export async function listAuditLogs(params) {
  const { data } = await api.get('/audit', { params })
  return data
}
