import { useCallback, useEffect, useRef, useState } from 'react'
import { signIn, confirmSignIn, signOut } from 'aws-amplify/auth'
import { Hub } from 'aws-amplify/utils'
import { AuthContext } from './AuthContext'
import { authConfigured, requireAuthConfig } from './config'
import { authErrorMessage } from './errors'
import {
  readSession,
  sessionUnavailable,
  subscribeSessionFailure,
} from './session'

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessionError, setSessionError] = useState('')
  const [challenge, setChallenge] = useState(null)
  // Prevent a pending session lookup from restoring a session after sign-out.
  const revision = useRef(0)
  const signingOut = useRef(false)
  const invalidate = useCallback((message = '') => {
    revision.current += 1
    setSession(null)
    setChallenge(null)
    setSessionError(message)
    setLoading(false)
  }, [])

  const checkSession = useCallback(
    async ({ forceRefresh = false, background = false } = {}) => {
      if (signingOut.current) return null
      const request = ++revision.current
      if (!background) setLoading(true)
      try {
        const next = await readSession({ forceRefresh })
        if (request === revision.current) {
          setSession(next)
          setSessionError('')
        }
        return next
      } catch (error) {
        if (request === revision.current) {
          setSession(null)
          setSessionError(authErrorMessage(error))
        }
        return null
      } finally {
        if (request === revision.current) setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    void checkSession()
    const stopFailure = subscribeSessionFailure(() =>
      invalidate(authErrorMessage(sessionUnavailable())),
    )
    const stopHub = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedOut') invalidate()
      if (payload.event === 'tokenRefresh_failure')
        invalidate(authErrorMessage(sessionUnavailable()))
      if (payload.event === 'signedIn') void checkSession()
    })
    const onFocus = () => {
      // Keep unsaved forms mounted while rechecking after returning to the tab.
      void checkSession({ background: true })
    }
    window.addEventListener('focus', onFocus)
    return () => {
      revision.current += 1
      stopFailure()
      stopHub()
      window.removeEventListener('focus', onFocus)
    }
  }, [checkSession, invalidate])

  async function finishSignIn(result) {
    if (result.isSignedIn) {
      setChallenge(null)
      if (!(await checkSession())) throw sessionUnavailable()
      return { signInStep: 'DONE' }
    }
    setChallenge(result.nextStep)
    return result.nextStep
  }
  async function login(email, password) {
    requireAuthConfig()
    setSessionError('')
    setChallenge(null)
    return finishSignIn(
      await signIn({
        username: email.trim(),
        password,
        options: { authFlowType: 'USER_SRP_AUTH' },
      }),
    )
  }
  async function completeNewPassword(password, userAttributes = {}) {
    return finishSignIn(
      await confirmSignIn({
        challengeResponse: password,
        options: { userAttributes },
      }),
    )
  }
  async function logout() {
    signingOut.current = true
    setLoading(true)
    revision.current += 1
    try {
      await signOut()
      invalidate()
    } catch (error) {
      setLoading(false)
      throw error
    } finally {
      signingOut.current = false
    }
  }

  const groups = session?.groups || []
  return (
    <AuthContext.Provider
      value={{
        user: session?.user || null,
        groups,
        loading,
        authenticated: Boolean(session),
        sessionError,
        challenge,
        authConfigured,
        hasRole: (role) => groups.includes(role),
        login,
        completeNewPassword,
        logout,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
