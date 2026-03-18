import api from '../../lib/axios'

export async function listPaymentMethods() {
  const { data } = await api.get('/payment-methods')
  return data
}

export async function createPaymentMethod(body) {
  const { data } = await api.post('/payment-methods', body)
  return data
}

export async function updatePaymentMethod(paymentMethodId, body) {
  const { data } = await api.patch(`/payment-methods/${paymentMethodId}`, body)
  return data
}
