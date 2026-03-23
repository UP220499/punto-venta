import api from '../../lib/axios'

export async function getSettings() {
  const { data } = await api.get('/settings')
  return data
}

export async function updateSettings(body) {
  const { data } = await api.patch('/settings', body)
  return data
}

export async function getBranding() {
  const { data } = await api.get('/settings/branding')
  return data
}
