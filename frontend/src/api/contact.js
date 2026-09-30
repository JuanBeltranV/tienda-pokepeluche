import { api } from './client'

export const contactApi = {
  list: (signal) => api.get('/contact', { signal }).then(({ data }) => data),
  create: (message) => api.post('/contact', message).then(({ data }) => data),
}
