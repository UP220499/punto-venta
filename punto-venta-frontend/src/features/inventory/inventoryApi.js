import api from '../../lib/axios'

export async function listMovements(params) {
  const { data } = await api.get('/inventory/movements', { params })
  return data
}

export async function createEntry(body) {
  const { data } = await api.post('/inventory/entries', body)
  return data
}

export async function createAdjustment(body) {
  const { data } = await api.post('/inventory/adjustments', body)
  return data
}
