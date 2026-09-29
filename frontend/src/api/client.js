import axios from 'axios'
import { getAccessToken } from '../auth/session'
import { authErrorMessage } from '../auth/errors'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(async (config) => {
  // Never leak a Cognito token through an absolute URL outside our API.
  const base = new URL(api.defaults.baseURL, window.location.origin)
  const target = new URL(api.getUri(config), window.location.origin)
  const prefix = base.pathname.replace(/\/$/, '')
  if (
    target.origin !== base.origin ||
    !target.pathname.startsWith(`${prefix}/`)
  ) {
    throw new Error(
      'El cliente API solo permite peticiones a su backend configurado.',
    )
  }
  config.headers.delete('Authorization')
  const isPublic =
    config.method === 'get' && target.pathname === `${prefix}/public/info`
  if (!isPublic)
    config.headers.set('Authorization', `Bearer ${await getAccessToken()}`)
  return config
})

export function errorMessage(error) {
  if (error.name === 'SessionUnavailableError') return authErrorMessage(error)
  if (error.response?.data?.detail) return error.response.data.detail
  if (error.code === 'ECONNABORTED')
    return 'La respuesta está tardando demasiado. Inténtalo de nuevo.'
  if (!error.response)
    return 'No pudimos conectar con el catálogo. Comprueba que el servidor esté disponible e inténtalo de nuevo.'
  return 'No pudimos completar la operación. Inténtalo de nuevo.'
}
