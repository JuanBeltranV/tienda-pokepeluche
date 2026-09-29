import { Amplify } from 'aws-amplify'

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID?.trim()
const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID?.trim()

export const authConfigured = Boolean(userPoolId && userPoolClientId)

// SRP with our own form; no Hosted Login, OAuth redirect or Identity Pool.
if (authConfigured) {
  Amplify.configure({ Auth: { Cognito: { userPoolId, userPoolClientId } } })
}

export function requireAuthConfig() {
  if (!authConfigured) {
    throw Object.assign(new Error('Configuración Cognito ausente.'), {
      name: 'AuthConfigurationError',
    })
  }
}
