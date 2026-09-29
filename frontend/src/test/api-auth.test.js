import { beforeEach, expect, it, vi } from 'vitest'
import { fetchAuthSession } from 'aws-amplify/auth'
import { api } from '../api/client'
import { subscribeSessionFailure } from '../auth/session'
vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn(),
  getCurrentUser: vi.fn(),
}))
vi.mock('../auth/config', () => ({ requireAuthConfig: vi.fn() }))
const adapter = vi.fn(async (config) => ({
  data: {},
  status: 200,
  statusText: 'OK',
  headers: {},
  config,
}))
beforeEach(() => {
  vi.clearAllMocks()
  fetchAuthSession.mockReset().mockResolvedValue({
    tokens: {
      accessToken: { toString: () => 'test-access-token' },
      idToken: { toString: () => 'test-id-token' },
    },
  })
})
it('obtiene el Access Token en cada petición, nunca el ID Token', async () => {
  await api.get('/products', { adapter })
  expect(adapter.mock.calls[0][0].headers.get('Authorization')).toBe(
    'Bearer test-access-token',
  )
  fetchAuthSession.mockResolvedValue({
    tokens: { accessToken: { toString: () => 'renewed-access' } },
  })
  await api.post('/contact', {}, { adapter })
  expect(adapter.mock.calls[1][0].headers.get('Authorization')).toBe(
    'Bearer renewed-access',
  )
  expect(fetchAuthSession).toHaveBeenCalledTimes(2)
})
it('no agrega Authorization ni solicita sesión para información pública', async () => {
  await api.get('/public/info', {
    adapter,
    headers: { Authorization: 'obsolete' },
  })
  expect(adapter.mock.calls[0][0].headers.has('Authorization')).toBe(false)
  expect(fetchAuthSession).not.toHaveBeenCalled()
})
it.each([{}, null])(
  'no envía una petición protegida sin tokens y avisa al contexto: %j',
  async (tokens) => {
    const listener = vi.fn()
    const stop = subscribeSessionFailure(listener)
    fetchAuthSession.mockResolvedValue({ tokens })
    await expect(api.get('/products', { adapter })).rejects.toMatchObject({
      name: 'SessionUnavailableError',
    })
    expect(adapter).not.toHaveBeenCalled()
    expect(listener).toHaveBeenCalledOnce()
    stop()
  },
)
it('maneja fallo de renovación sin enviar una petición anónima', async () => {
  fetchAuthSession.mockRejectedValue({ name: 'NotAuthorizedException' })
  await expect(api.delete('/products/1', { adapter })).rejects.toMatchObject({
    name: 'SessionUnavailableError',
  })
  expect(adapter).not.toHaveBeenCalled()
})
it('impide filtrar un token hacia un origen ajeno al backend', async () => {
  await expect(
    api.get('https://example.com/collect', { adapter }),
  ).rejects.toThrow('backend configurado')
  expect(fetchAuthSession).not.toHaveBeenCalled()
  expect(adapter).not.toHaveBeenCalled()
})
