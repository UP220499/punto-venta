import api from '../../lib/axios'

export async function getReportsSalesSummary({ from, to } = {}) {
  const params = {}
  if (from) params.from = from
  if (to)   params.to   = to
  const { data } = await api.get('/reports/sales/summary', { params })
  return data
}

export async function getReportsSalesByDay({ from, to }) {
  const { data } = await api.get('/reports/sales/by-day', { params: { from, to } })
  return data
}

export async function getReportsTopProducts({ from, to, limit = 10 }) {
  const { data } = await api.get('/reports/top-products', { params: { from, to, limit } })
  return data
}

export async function getReportsInventorySummary({ from, to }) {
  const { data } = await api.get('/reports/inventory/summary', { params: { from, to } })
  return data
}
