import axios from 'axios'

// The future Cognito token interceptor belongs here. Phase 1 has no session.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

export function errorMessage(error) {
  if (error.response?.data?.detail) return error.response.data.detail
  if (error.code === 'ECONNABORTED')
    return 'La respuesta está tardando demasiado. Inténtalo de nuevo.'
  if (!error.response)
    return 'No pudimos conectar con el catálogo. Comprueba que el servidor esté disponible e inténtalo de nuevo.'
  return 'No pudimos completar la operación. Inténtalo de nuevo.'
}
