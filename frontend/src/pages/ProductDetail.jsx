import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, MessageSquare, Package } from 'lucide-react'
import { productsApi } from '../api/products'
import { errorMessage } from '../api/client'
import { dexNumber, formatPrice } from '../lib/format'
import { ErrorNotice, Loading } from '../components/Feedback'
import ProductImage from '../components/ProductImage'

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    productsApi
      .get(id, controller.signal)
      .then(setProduct)
      .catch((err) => {
        if (!controller.signal.aborted) setError(errorMessage(err))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [id, revision])

  return (
    <div className="page detail-page">
      <Link className="back-link" to="/productos">
        <ArrowLeft size={16} />
        Volver a la colección
      </Link>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNotice
          message={error}
          onRetry={() => setRevision(revision + 1)}
        />
      ) : (
        product && (
          <>
            <div className="detail-grid">
              <div className="detail-image">
                <span className="dex-label">
                  {dexNumber(product.pokemonId)}
                </span>
                <ProductImage product={product} />
              </div>
              <div className="detail-copy">
                <span className="eyebrow">UN COMPAÑERO PARA TU COLECCIÓN</span>
                <h1>{product.name}</h1>
                <div className="detail-price">
                  {formatPrice(product.price)} <span>CLP</span>
                </div>
                <p className="description">{product.description}</p>
                <div className="stock-panel">
                  <Package size={21} />
                  <div>
                    <strong>
                      {product.stock
                        ? 'Listo para una nueva aventura'
                        : 'Sin stock disponible'}
                    </strong>
                    <span>{product.stock} unidades en el catálogo</span>
                  </div>
                </div>
                <Link className="button primary" to="/contacto">
                  <MessageSquare size={18} />
                  Consultar sobre este peluche
                </Link>
                <small className="form-hint">
                  Producto de demostración. No se realizan compras.
                </small>
              </div>
            </div>
            <section className="pokedex-panel">
              <div className="pokedex-icon">
                <BookOpen size={25} />
              </div>
              <div>
                <span className="eyebrow">ARCHIVO POKÉDEX · PRÓXIMAMENTE</span>
                <h2>Hay mucho más por descubrir.</h2>
                <p>
                  Información Pokédex disponible próximamente: tipos, altura,
                  peso y sprite de tu compañero.
                </p>
              </div>
              <span className="pending-badge">POR DESCUBRIR</span>
            </section>
          </>
        )
      )}
    </div>
  )
}
