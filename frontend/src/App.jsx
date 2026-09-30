import { useEffect, useRef } from 'react'
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import {
  ArrowUpRight,
  BookOpen,
  Inbox,
  MessageSquare,
  Settings2,
  UserRound,
} from 'lucide-react'
import Catalog from './pages/Catalog'
import ProductDetail from './pages/ProductDetail'
import AdminProducts from './pages/AdminProducts'
import Contact from './pages/Contact'
import ContactMessages from './pages/ContactMessages'
import Login from './pages/Login'
import { useAuth } from './auth/AuthContext'
import ProtectedRoute from './auth/ProtectedRoute'
import UserMenu from './auth/UserMenu'
import { APP_ROLES } from './auth/session'

function Shell({ children }) {
  const { authenticated, hasRole } = useAuth()
  const location = useLocation()
  const main = useRef(null)
  const first = useRef(true)
  useEffect(() => {
    window.scrollTo(0, 0)
    if (first.current) first.current = false
    else main.current.focus({ preventScroll: true })
  }, [location.pathname])
  return (
    <>
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link
            to="/productos"
            className="brand"
            aria-label="PokePeluche, inicio"
          >
            <span className="brand-mark">
              <img
                className="pokeball-icon"
                src="/images/pokeball.svg"
                alt=""
              />
            </span>
            <span>
              Poke<span className="brand-light">Peluche</span>
              <small>COMPAÑEROS DE AVENTURA</small>
            </span>
          </Link>
          {authenticated && APP_ROLES.some(hasRole) && (
            <nav aria-label="Navegación principal">
              <NavLink to="/productos">
                <BookOpen size={17} />
                Catálogo
              </NavLink>
              <NavLink to="/contacto" end>
                <MessageSquare size={17} />
                Contacto
              </NavLink>
              {(hasRole('ADMIN') || hasRole('EDITOR')) && (
                <NavLink to="/contacto/mensajes">
                  <Inbox size={17} />
                  Mensajes
                </NavLink>
              )}
              {hasRole('ADMIN') && (
                <NavLink to="/admin/productos">
                  <Settings2 size={17} />
                  Gestionar
                </NavLink>
              )}
            </nav>
          )}
          {authenticated ? (
            <UserMenu />
          ) : (
            <NavLink className="login-link" to="/login" aria-label="Mi cuenta">
              <UserRound size={18} />
              <span>Mi cuenta</span>
              <ArrowUpRight size={15} />
            </NavLink>
          )}
        </div>
      </header>
      <main id="contenido" ref={main} tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        <div>
          <Link className="footer-brand" to="/productos">
            <img className="pokeball-icon" src="/images/pokeball.svg" alt="" />
            PokePeluche
          </Link>
          <span>Hecho para coleccionar sonrisas.</span>
        </div>
        <span className="footer-code">
          FIN DE LA RUTA <span aria-hidden="true">✦</span>
        </span>
      </footer>
    </>
  )
}

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Navigate to="/productos" replace />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/productos" element={<Catalog />} />
          <Route path="/productos/:id" element={<ProductDetail />} />
          <Route path="/contacto" element={<Contact />} />
        </Route>
        <Route element={<ProtectedRoute roles={['ADMIN']} />}>
          <Route path="/admin/productos" element={<AdminProducts />} />
        </Route>
        <Route element={<ProtectedRoute roles={['ADMIN', 'EDITOR']} />}>
          <Route path="/contacto/mensajes" element={<ContactMessages />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route
          path="*"
          element={
            <div className="empty-state">
              <span className="eyebrow">RUTA 404</span>
              <h1>Este camino aún no existe.</h1>
              <Link className="button primary" to="/productos">
                Volver al catálogo
              </Link>
            </div>
          }
        />
      </Routes>
    </Shell>
  )
}
