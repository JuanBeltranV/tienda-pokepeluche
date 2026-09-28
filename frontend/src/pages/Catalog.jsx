import { useMemo, useState } from 'react'
import { ArrowRight, MessageSquare, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts'
import ProductCard from '../components/ProductCard'
import { ErrorNotice, Loading } from '../components/Feedback'

export default function Catalog() {
  const { products, loading, error, reload } = useProducts()
  const [search, setSearch] = useState('')
  const [availability, setAvailability] = useState('all')
  const [sort, setSort] = useState('dex')
  const filtered = useMemo(
    () =>
      products
        .filter(
          (p) =>
            `${p.name} ${p.pokemonName} ${p.pokemonId}`
              .toLowerCase()
              .includes(search.trim().toLowerCase()) &&
            (availability === 'all' || p.stock > 0),
        )
        .sort((a, b) =>
          sort === 'price' ? a.price - b.price : a.pokemonId - b.pokemonId,
        ),
    [products, search, availability, sort],
  )

  return (
    <div className="page catalog-page">
      <div className="route-dialog">
        <span className="dialog-label">¡HOLA, ENTRENADOR!</span>
        <p>Hay un compañero para cada aventura. ¿Cuál será el tuyo?</p>
        <span aria-hidden="true">▼</span>
      </div>
      <section id="coleccion" className="collection">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ELIGE A TU COMPAÑERO</span>
            <h1>
              Compañeros destacados{' '}
              <span className="count-badge">
                {loading || error
                  ? '—'
                  : String(products.length).padStart(2, '0')}
              </span>
            </h1>
          </div>
        </div>
        <div className="catalog-toolbar">
          <div className="filter-tabs" role="group" aria-label="Disponibilidad">
            <button
              className={availability === 'all' ? 'selected' : ''}
              aria-pressed={availability === 'all'}
              onClick={() => setAvailability('all')}
            >
              Todos los compañeros
            </button>
            <button
              className={availability === 'stock' ? 'selected' : ''}
              aria-pressed={availability === 'stock'}
              onClick={() => setAvailability('stock')}
            >
              Disponibles
            </button>
          </div>
          <div className="catalog-controls">
            <label className="search-field">
              <Search size={17} />
              <input
                aria-label="Buscar peluche"
                placeholder="Busca a tu favorito…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <select
              aria-label="Ordenar productos"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="dex">N.º Pokédex</option>
              <option value="price">Menor precio</option>
            </select>
          </div>
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorNotice message={error} onRetry={reload} />
        ) : filtered.length ? (
          <>
            <div className="product-grid">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <p className="catalog-caption">
              {filtered.length}{' '}
              {filtered.length === 1
                ? 'compañero en esta ruta'
                : 'compañeros en esta ruta'}{' '}
              <span>Precios referenciales en pesos chilenos.</span>
            </p>
          </>
        ) : (
          <div className="empty-state">
            <Search size={28} />
            <h3>
              {products.length
                ? 'No encontramos ese compañero.'
                : 'La colección está por comenzar.'}
            </h3>
            <p>
              {products.length
                ? 'Prueba con otro nombre o número Pokédex.'
                : 'Crea el primer producto desde Gestionar.'}
            </p>
            {products.length > 0 && (
              <button
                className="button secondary"
                onClick={() => {
                  setSearch('')
                  setAvailability('all')
                }}
              >
                Ver todos
              </button>
            )}
          </div>
        )}
      </section>
      <aside className="contact-banner">
        <div className="banner-icon">
          <MessageSquare size={24} />
        </div>
        <div>
          <h3>Cada aventura empieza con un «hola».</h3>
          <p>¿Tienes alguna pregunta sobre nuestros compañeros? Te leemos.</p>
        </div>
        <Link to="/contacto">
          Hablemos <ArrowRight size={18} />
        </Link>
      </aside>
    </div>
  )
}
