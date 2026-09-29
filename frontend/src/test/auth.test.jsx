import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import {
  fetchAuthSession,
  getCurrentUser,
  signIn,
  confirmSignIn,
  signOut,
} from 'aws-amplify/auth'
import { Hub } from 'aws-amplify/utils'
import AuthProvider from '../auth/AuthProvider'
import { useAuth } from '../auth/AuthContext'
import App from '../App'
import { productsApi } from '../api/products'

vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn(),
  getCurrentUser: vi.fn(),
  signIn: vi.fn(),
  confirmSignIn: vi.fn(),
  signOut: vi.fn(),
}))
vi.mock('aws-amplify/utils', () => ({ Hub: { listen: vi.fn(() => vi.fn()) } }))
vi.mock('../auth/config', () => ({
  authConfigured: true,
  requireAuthConfig: vi.fn(),
}))
vi.mock('../api/products', () => ({
  productsApi: { list: vi.fn(), get: vi.fn() },
}))

const signedSession = (groups = ['ADMIN']) => ({
  tokens: {
    accessToken: { payload: { 'cognito:groups': groups } },
    idToken: { payload: { email: 'trainer@example.com' } },
  },
})
const renderApp = (path = '/productos') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
async function enterCredentials() {
  await userEvent.type(
    await screen.findByLabelText('Correo electrónico'),
    'trainer@example.com',
  )
  await userEvent.type(screen.getByLabelText('Contraseña'), 'test-only-input')
  await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
}
function SessionProbe() {
  const auth = useAuth()
  return (
    <>
      <p>
        {auth.loading
          ? 'loading'
          : auth.authenticated
            ? 'authenticated'
            : 'anonymous'}
      </p>
      <p>{auth.groups.join(',')}</p>
      <button onClick={() => auth.checkSession({ forceRefresh: true })}>
        Refresh
      </button>
      <button onClick={auth.logout}>Logout</button>
    </>
  )
}
beforeEach(() => {
  vi.clearAllMocks()
  fetchAuthSession.mockReset().mockResolvedValue({})
  getCurrentUser
    .mockReset()
    .mockResolvedValue({ userId: 'test-user', username: 'trainer' })
  signIn.mockReset()
  confirmSignIn.mockReset()
  signOut.mockReset().mockResolvedValue(undefined)
  productsApi.list.mockResolvedValue([])
  Hub.listen.mockImplementation(() => vi.fn())
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})

describe('Autenticación y autorización del frontend', () => {
  it('comprobar sesión al recuperar foco no desmonta el formulario con datos sin guardar', async () => {
    fetchAuthSession.mockResolvedValue(signedSession(['USER']))
    renderApp('/contacto')
    await userEvent.type(
      await screen.findByLabelText('Tu nombre'),
      'Dato sin guardar',
    )
    let resolve
    fetchAuthSession.mockReturnValue(
      new Promise((done) => {
        resolve = done
      }),
    )
    act(() => window.dispatchEvent(new Event('focus')))
    expect(screen.getByLabelText('Tu nombre')).toHaveValue('Dato sin guardar')
    await act(async () => resolve(signedSession(['USER'])))
    expect(screen.getByLabelText('Tu nombre')).toHaveValue('Dato sin guardar')
  })
  it('oculta contenido mientras comprueba sesión y redirige al login sin sesión', async () => {
    let resolve
    fetchAuthSession.mockReturnValue(
      new Promise((done) => {
        resolve = done
      }),
    )
    renderApp('/admin/productos')
    expect(screen.getByText('Comprobando tu sesión…')).toBeInTheDocument()
    expect(productsApi.list).not.toHaveBeenCalled()
    await act(async () => resolve({}))
    expect(
      await screen.findByRole('button', { name: 'Iniciar sesión' }),
    ).toBeEnabled()
    expect(
      screen.queryByRole('heading', { name: 'Gestionar productos' }),
    ).not.toBeInTheDocument()
  })
  it('restaura ADMIN al montar y muestra gestión', async () => {
    fetchAuthSession.mockResolvedValue(signedSession())
    renderApp('/admin/productos')
    expect(
      await screen.findByRole('heading', { name: 'Gestionar productos' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Gestionar' })).toBeInTheDocument()
    expect(screen.getByText('trainer@example.com')).toBeInTheDocument()
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
  })
  it.each(['USER', 'EDITOR'])(
    '%s ve catálogo/contacto pero no Gestionar; URL directa denegada',
    async (role) => {
      fetchAuthSession.mockResolvedValue(signedSession([role]))
      renderApp('/admin/productos')
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'no tienes permiso',
      )
      expect(
        screen.queryByRole('link', { name: 'Gestionar' }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('heading', { name: 'Gestionar productos' }),
      ).not.toBeInTheDocument()
      expect(productsApi.list).not.toHaveBeenCalled()
      await userEvent.click(
        screen.getByRole('link', { name: 'Catálogo', exact: true }),
      )
      expect(
        await screen.findByRole('heading', { name: /Compañeros destacados/ }),
      ).toBeInTheDocument()
      await userEvent.click(
        screen.getByRole('link', { name: 'Contacto', exact: true }),
      )
      expect(
        await screen.findByRole('button', { name: 'Enviar mensaje' }),
      ).toBeInTheDocument()
    },
  )
  it.each([[], ['OTHER'], 'ADMIN'])(
    'deniega grupos ausentes, desconocidos o malformados: %j',
    async (groups) => {
      fetchAuthSession.mockResolvedValue(signedSession(groups))
      renderApp()
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'no tienes permiso',
      )
      expect(productsApi.list).not.toHaveBeenCalled()
    },
  )
  it('inicia sesión con SRP y vuelve a la ruta protegida solicitada', async () => {
    signIn.mockImplementation(async () => {
      fetchAuthSession.mockResolvedValue(signedSession())
      return { isSignedIn: true, nextStep: { signInStep: 'DONE' } }
    })
    renderApp('/admin/productos')
    await enterCredentials()
    expect(signIn).toHaveBeenCalledWith({
      username: 'trainer@example.com',
      password: 'test-only-input',
      options: { authFlowType: 'USER_SRP_AUTH' },
    })
    expect(
      await screen.findByRole('heading', { name: 'Gestionar productos' }),
    ).toBeInTheDocument()
  })
  it('muestra espera, evita doble envío, limpia contraseña y explica credenciales inválidas', async () => {
    let reject
    signIn.mockReturnValue(
      new Promise((_, fail) => {
        reject = fail
      }),
    )
    renderApp('/login')
    await enterCredentials()
    expect(screen.getByRole('button', { name: 'Conectando…' })).toBeDisabled()
    await act(async () => reject({ name: 'NotAuthorizedException' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Correo o contraseña incorrectos',
    )
    expect(screen.getByLabelText('Contraseña')).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeEnabled()
  })
  it('completa contraseña obligatoria y atributos requeridos antes de dar acceso', async () => {
    signIn.mockResolvedValue({
      isSignedIn: false,
      nextStep: {
        signInStep: 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED',
        missingAttributes: ['name'],
      },
    })
    confirmSignIn.mockImplementation(async () => {
      fetchAuthSession.mockResolvedValue(signedSession(['USER']))
      return { isSignedIn: true, nextStep: { signInStep: 'DONE' } }
    })
    renderApp('/productos')
    await enterCredentials()
    expect(await screen.findByLabelText('Nueva contraseña')).toHaveValue('')
    expect(productsApi.list).not.toHaveBeenCalled()
    await userEvent.type(
      screen.getByLabelText('Nueva contraseña'),
      'new-test-only-input',
    )
    await userEvent.type(
      screen.getByLabelText('Confirmar nueva contraseña'),
      'new-test-only-input',
    )
    await userEvent.type(
      screen.getByLabelText('Dato requerido: name'),
      'Trainer',
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Guardar contraseña y entrar' }),
    )
    expect(confirmSignIn).toHaveBeenCalledWith({
      challengeResponse: 'new-test-only-input',
      options: { userAttributes: { name: 'Trainer' } },
    })
    expect(
      await screen.findByRole('heading', { name: /Compañeros destacados/ }),
    ).toBeInTheDocument()
  })
  it('permite corregir una contraseña nueva que Cognito rechaza', async () => {
    signIn.mockResolvedValue({
      isSignedIn: false,
      nextStep: { signInStep: 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED' },
    })
    confirmSignIn.mockRejectedValue({ name: 'InvalidPasswordException' })
    renderApp('/login')
    await enterCredentials()
    await userEvent.type(
      await screen.findByLabelText('Nueva contraseña'),
      'short',
    )
    await userEvent.type(
      screen.getByLabelText('Confirmar nueva contraseña'),
      'short',
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Guardar contraseña y entrar' }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'no cumple la política',
    )
    expect(screen.getByLabelText('Nueva contraseña')).toHaveValue('')
    expect(productsApi.list).not.toHaveBeenCalled()
  })
  it('un desafío no soportado no autentica y permite reiniciar', async () => {
    signIn.mockResolvedValue({
      isSignedIn: false,
      nextStep: { signInStep: 'CONFIRM_SIGN_IN_WITH_TOTP_CODE' },
    })
    renderApp('/login')
    await enterCredentials()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'verificación adicional',
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Volver al inicio de sesión' }),
    )
    expect(
      await screen.findByRole('button', { name: 'Iniciar sesión' }),
    ).toBeEnabled()
    expect(signOut).toHaveBeenCalled()
  })
  it('logout usa Amplify y elimina acceso al volver a una ruta protegida', async () => {
    fetchAuthSession.mockResolvedValue(signedSession())
    signOut.mockImplementation(async () => {
      fetchAuthSession.mockResolvedValue({})
    })
    renderApp()
    await userEvent.click(
      await screen.findByRole('button', { name: 'Cerrar sesión' }),
    )
    expect(
      await screen.findByRole('button', { name: 'Iniciar sesión' }),
    ).toBeEnabled()
    expect(signOut).toHaveBeenCalledOnce()
    await userEvent.click(
      screen.getByRole('link', { name: 'PokePeluche, inicio' }),
    )
    expect(
      await screen.findByRole('button', { name: 'Iniciar sesión' }),
    ).toBeEnabled()
  })
  it('invalida la UI si Amplify no puede renovar el token', async () => {
    fetchAuthSession.mockResolvedValue(signedSession())
    renderApp()
    await screen.findByRole('heading', { name: /Compañeros destacados/ })
    const listener = Hub.listen.mock.calls[0][1]
    act(() => listener({ payload: { event: 'tokenRefresh_failure' } }))
    expect(
      await screen.findByRole('button', { name: 'Iniciar sesión' }),
    ).toBeEnabled()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'sesión no está disponible',
    )
  })
  it('normaliza roles y permite comprobar sesión forzando renovación', async () => {
    fetchAuthSession.mockResolvedValue(
      signedSession(['ADMIN', 'ADMIN', 'unknown']),
    )
    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    )
    expect(await screen.findByText('authenticated')).toBeInTheDocument()
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
    fetchAuthSession.mockResolvedValue(signedSession(['EDITOR']))
    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }))
    expect(await screen.findByText('EDITOR')).toBeInTheDocument()
    expect(fetchAuthSession).toHaveBeenLastCalledWith({ forceRefresh: true })
  })
  it('una consulta tardía no restaura una sesión después de logout', async () => {
    let resolve
    fetchAuthSession.mockReturnValue(
      new Promise((done) => {
        resolve = done
      }),
    )
    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Logout' }))
    await act(async () => resolve(signedSession()))
    await waitFor(() =>
      expect(screen.getByText('anonymous')).toBeInTheDocument(),
    )
  })
})
