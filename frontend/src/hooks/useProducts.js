import { useCallback, useEffect, useState } from 'react'
import { productsApi } from '../api/products'
import { errorMessage } from '../api/client'

export function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const reload = useCallback(() => setRevision((value) => value + 1), [])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    productsApi
      .list(controller.signal)
      .then(setProducts)
      .catch((err) => {
        if (!controller.signal.aborted) setError(errorMessage(err))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [revision])

  return { products, loading, error, reload }
}
