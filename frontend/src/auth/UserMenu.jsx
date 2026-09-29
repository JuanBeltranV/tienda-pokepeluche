import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from './AuthContext'
import { authErrorMessage } from './errors'

export default function UserMenu() {
  const { user, groups, logout } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  async function handleLogout() {
    setBusy(true)
    setError('')
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="user-menu">
      <span className="user-identity" title={user.email}>
        {user.email}
        <small>{groups.join(' · ') || 'SIN ROL ASIGNADO'}</small>
      </span>
      <button
        className="button secondary"
        onClick={handleLogout}
        disabled={busy}
      >
        <LogOut size={16} />
        {busy ? 'Cerrando…' : 'Cerrar sesión'}
      </button>
      {error && (
        <span className="field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
