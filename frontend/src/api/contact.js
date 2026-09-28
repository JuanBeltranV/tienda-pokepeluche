import { api } from './client'

export const contactApi = {
  create: (message) => api.post('/contact', message).then(({ data }) => data),
}
