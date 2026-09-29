import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth'
import { requireAuthConfig } from './config'

export const APP_ROLES = ['ADMIN', 'EDITOR', 'USER']
const listeners = new Set()
export const subscribeSessionFailure = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
export function notifySessionFailure() {
  for (const listener of listeners) listener()
}
export function sessionUnavailable() {
  return Object.assign(new Error('Sesión no disponible.'), {
    name: 'SessionUnavailableError',
  })
}

export async function readSession(options = {}) {
  requireAuthConfig()
  const session = await fetchAuthSession(options)
  if (!session.tokens?.accessToken) return null
  const current = await getCurrentUser()
  const claim = session.tokens.accessToken.payload['cognito:groups']
  const groups = Array.isArray(claim)
    ? [...new Set(claim.filter((role) => APP_ROLES.includes(role)))]
    : []
  return {
    user: {
      id: current.userId,
      username: current.username,
      email:
        session.tokens.idToken?.payload.email ||
        current.signInDetails?.loginId ||
        current.username,
    },
    groups,
  }
}

export async function getAccessToken() {
  try {
    requireAuthConfig()
    const session = await fetchAuthSession()
    const token = session.tokens?.accessToken
    if (!token) throw sessionUnavailable()
    return token.toString()
  } catch {
    notifySessionFailure()
    throw sessionUnavailable()
  }
}
