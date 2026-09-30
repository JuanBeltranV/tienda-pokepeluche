import { useState } from 'react'
import { LockKeyhole } from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { authErrorMessage, unsupportedStepMessage } from '../auth/errors'
import { ErrorNotice, Loading } from '../components/Feedback'

const NEW_PASSWORD = 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED'

export default function Login() {
  const auth = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [attributes, setAttributes] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const newPassword = auth.challenge?.signInStep === NEW_PASSWORD
  const unsupported = auth.challenge && !newPassword
  const from = location.state?.from
  const destination =
    typeof from === 'string' &&
    /^\/(productos(?:\/\d+)?|contacto(?:\/mensajes)?|admin\/productos)(?:\?.*)?$/.test(
      from,
    )
      ? from
      : '/productos'

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (newPassword && password !== confirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setBusy(true)
    try {
      const next = newPassword
        ? await auth.completeNewPassword(password, attributes)
        : await auth.login(email, password)
      if (next.signInStep !== 'DONE' && next.signInStep !== NEW_PASSWORD) {
        setError(unsupportedStepMessage(next.signInStep))
      }
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      // Passwords live only in this form while entered and are cleared after use.
      setPassword('')
      setConfirmation('')
      setBusy(false)
    }
  }
  async function restart() {
    setBusy(true)
    setError('')
    try {
      await auth.logout()
      setPassword('')
      setConfirmation('')
      setAttributes({})
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (auth.loading) return <Loading label="Comprobando tu sesión…" />
  if (auth.authenticated) return <Navigate to={destination} replace />
  return (
    <div className="page login-page">
      <section className="login-story">
        <span className="eyebrow">TU PUNTO DE ENCUENTRO</span>
        <h1>
          Toda aventura
          <br />
          empieza con
          <br />
          <em>un compañero.</em>
        </h1>
        <img
          src="/images/pokebola-pikachu.png"
          alt="Peluche de Pikachu junto a una pokebola"
        />
      </section>
      <section className="login-panel">
        <span className="brand-mark">
          <img className="pokeball-icon" src="/images/pokeball.svg" alt="" />
        </span>
        <h2>{newPassword ? 'Una nueva contraseña.' : 'Qué bueno verte.'}</h2>
        <p>
          {newPassword
            ? 'Para completar tu primer acceso, reemplaza la contraseña temporal por una propia.'
            : 'Inicia sesión para descubrir a tu próximo compañero.'}
        </p>
        <div className="notice">
          <LockKeyhole size={20} />
          <span>Acceso con tu cuenta de Amazon Cognito.</span>
        </div>
        <ErrorNotice message={error || auth.sessionError} />
        {unsupported && !error && (
          <ErrorNotice
            message={unsupportedStepMessage(auth.challenge.signInStep)}
          />
        )}
        {!unsupported && (
          <form onSubmit={submit} aria-busy={busy}>
            <fieldset
              disabled={busy || !auth.authConfigured}
              className="form-fields"
            >
              {!newPassword && (
                <div className="field">
                  <label htmlFor="login-email">Correo electrónico</label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              )}
              <div className="field">
                <label htmlFor="login-password">
                  {newPassword ? 'Nueva contraseña' : 'Contraseña'}
                </label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete={
                    newPassword ? 'new-password' : 'current-password'
                  }
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {newPassword && (
                <>
                  <div className="field">
                    <label htmlFor="password-confirmation">
                      Confirmar nueva contraseña
                    </label>
                    <input
                      id="password-confirmation"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={confirmation}
                      onChange={(e) => setConfirmation(e.target.value)}
                    />
                  </div>
                  <p className="form-hint">
                    Usa la longitud y complejidad exigidas por el administrador
                    del User Pool.
                  </p>
                  {(auth.challenge.missingAttributes || []).map((name) => (
                    <div className="field" key={name}>
                      <label htmlFor={`attribute-${name}`}>
                        Dato requerido: {name}
                      </label>
                      <input
                        id={`attribute-${name}`}
                        type={name === 'email' ? 'email' : 'text'}
                        required
                        value={attributes[name] || ''}
                        onChange={(e) =>
                          setAttributes({
                            ...attributes,
                            [name]: e.target.value,
                          })
                        }
                      />
                    </div>
                  ))}
                </>
              )}
              <button type="submit" className="button primary">
                {busy
                  ? 'Conectando…'
                  : newPassword
                    ? 'Guardar contraseña y entrar'
                    : 'Iniciar sesión'}
              </button>
            </fieldset>
          </form>
        )}
        {busy && <p role="status">Procesando el acceso…</p>}
        {auth.challenge && (
          <button className="text-button" disabled={busy} onClick={restart}>
            Volver al inicio de sesión
          </button>
        )}
      </section>
    </div>
  )
}
