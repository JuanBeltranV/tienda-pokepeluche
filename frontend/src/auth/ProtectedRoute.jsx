import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { APP_ROLES } from './session'
import { Loading } from '../components/Feedback'

export default function ProtectedRoute({ roles = APP_ROLES }) {
  const { loading, authenticated, hasRole } = useAuth()
  const location = useLocation()
  if (loading) return <Loading label="Comprobando tu sesión…" />
  if (!authenticated)
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    )
  if (!roles.some(hasRole))
    return (
      <div className="page empty-state" role="alert">
        <span className="eyebrow">ACCESO RESTRINGIDO</span>
        <h1>Esta ruta no está disponible para tu rol.</h1>
        <p>
          Tu sesión está activa, pero no tienes permiso para acceder a esta
          sección.
        </p>
        {APP_ROLES.some(hasRole) && (
          <Link className="button secondary" to="/productos">
            Volver al catálogo
          </Link>
        )}
      </div>
    )
  return <Outlet />
}
