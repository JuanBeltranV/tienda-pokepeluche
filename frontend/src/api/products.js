import { api } from './client'

export const productsApi = {
  list: (signal) => api.get('/products', { signal }).then(({ data }) => data),
  get: (id, signal) =>
    api
      .get(`/products/${encodeURIComponent(id)}`, { signal })
      .then(({ data }) => data),
  create: (product) => api.post('/products', product).then(({ data }) => data),
  update: (id, product) =>
    api.put(`/products/${id}`, product).then(({ data }) => data),
  remove: (id) => api.delete(`/products/${id}`),
}
