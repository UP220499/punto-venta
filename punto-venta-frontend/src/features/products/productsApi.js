import api from '../../lib/axios'

export async function listProducts(params) {
  const { data } = await api.get('/products', { params })
  return data
}

export async function createProduct(body) {
  const { data } = await api.post('/products', body)
  return data
}

export async function updateProduct({ productId, ...body }) {
  const { data } = await api.patch(`/products/${productId}`, body)
  return data
}
