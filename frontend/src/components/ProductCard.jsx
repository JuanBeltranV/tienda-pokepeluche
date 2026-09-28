import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { dexNumber, formatPrice } from '../lib/format'
import ProductImage from './ProductImage'

export default function ProductCard({ product }) {
  return (
    <Link className="product-card" to={`/productos/${product.id}`}>
      <div className="product-art">
        <span className="dex-label">{dexNumber(product.pokemonId)}</span>
        <ProductImage product={product} />
        <span className="card-arrow">
          <ArrowUpRight size={19} />
        </span>
      </div>
      <div className="product-card-body">
        <div className="stock-label">
          <span className={product.stock ? 'dot' : 'dot muted'} />
          {product.stock ? `${product.stock} disponibles` : 'Sin stock'}
        </div>
        <h3>{product.name}</h3>
        <div className="price-line">
          <strong>{formatPrice(product.price)}</strong>
          <span>CLP</span>
        </div>
      </div>
    </Link>
  )
}
