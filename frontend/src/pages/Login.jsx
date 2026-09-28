import { LockKeyhole } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Login() {
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
        <h2>Qué bueno verte.</h2>
        <p>Tu espacio para seguir descubriendo compañeros.</p>
        <div className="notice">
          <LockKeyhole size={20} />
          <span>
            El acceso con cuenta estará disponible próximamente mediante Amazon
            Cognito.
          </span>
        </div>
        <form onSubmit={(event) => event.preventDefault()}>
          <fieldset disabled className="form-fields">
            <div className="field">
              <label htmlFor="login-email">Usuario o correo</label>
              <input
                id="login-email"
                placeholder="Próximamente"
                autoComplete="username"
              />
            </div>
            <div className="field">
              <label htmlFor="login-password">Contraseña</label>
              <input
                id="login-password"
                type="password"
                placeholder="Próximamente"
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="button primary">
              Iniciar sesión · Próximamente
            </button>
          </fieldset>
        </form>
        <Link className="back-link" to="/productos">
          Mientras tanto, explora la colección →
        </Link>
      </section>
    </div>
  )
}
