import { useState } from 'react'

export default function ProductImage({ product, className = '' }) {
  const [failedUrl, setFailedUrl] = useState(null)
  return (
    <img
      className={className}
      src={
        failedUrl === product.imageUrl
          ? '/images/plush-sage.svg'
          : product.imageUrl
      }
      alt={`Imagen ilustrativa de ${product.name}`}
      loading="lazy"
      onError={() => setFailedUrl(product.imageUrl)}
    />
  )
}
