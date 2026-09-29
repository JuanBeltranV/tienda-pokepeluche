import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { useProducts } from '../hooks/useProducts'
import { productsApi } from '../api/products'
import { errorMessage } from '../api/client'
import { dexNumber, formatPrice } from '../lib/format'
import { ErrorNotice, Loading } from '../components/Feedback'
import ProductForm from '../components/ProductForm'
import ProductImage from '../components/ProductImage'
import ConfirmDelete from '../components/ConfirmDelete'

export default function AdminProducts() {
  const { products, loading, error, reload } = useProducts()
  const [editing, setEditing] = useState(undefined)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [notice, setNotice] = useState('')
  const formHeading = useRef(null)
  const addButton = useRef(null)
  useEffect(() => {
    if (editing !== undefined) formHeading.current?.focus()
  }, [editing])
  function closeForm() {
    setEditing(undefined)
    addButton.current?.focus()
  }
  async function remove() {
    setBusy(true)
    setDeleteError('')
    try {
      await productsApi.remove(deleting.id)
      setNotice(`Se eliminó ${deleting.name}.`)
      if (editing?.id === deleting.id) closeForm()
      setDeleting(null)
      reload()
      addButton.current?.focus()
    } catch (err) {
      setDeleteError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page admin-page">
      <div className="section-heading page-heading">
        <div>
          <span className="eyebrow">EL TALLER DE COMPAÑEROS</span>
          <h1>Gestionar productos</h1>
          <p>Cuida cada detalle de tu colección.</p>
        </div>
        <button
          ref={addButton}
          className="button primary"
          onClick={() => {
            setEditing(null)
            setNotice('')
          }}
        >
          <Plus size={18} />
          Nuevo producto
        </button>
      </div>
      <div className="local-notice">
        <span className="dot" />
        <strong>Modo local</strong>
        <span>
          Gestión de productos reservada a cuentas ADMIN.
        </span>
      </div>
      {notice && (
        <div className="notice success" role="status">
          {notice}
        </div>
      )}
      {editing !== undefined && (
        <section className="editor-panel">
          <h2 ref={formHeading} tabIndex={-1}>
            {editing ? 'Editar compañero' : 'Un nuevo compañero'}
          </h2>
          <ProductForm
            key={editing?.id ?? 'new'}
            product={editing}
            onCancel={closeForm}
            onSaved={(saved) => {
              setNotice(`Se guardó ${saved.name}.`)
              closeForm()
              reload()
            }}
          />
        </section>
      )}
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNotice message={error} onRetry={reload} />
      ) : !products.length ? (
        <div className="empty-state">
          <h2>Tu colección empieza aquí.</h2>
          <p>Usa «Nuevo producto» para agregar un compañero.</p>
        </div>
      ) : (
        <div className="table-scroll">
          <table>
            <caption>
              Productos del catálogo · {products.length} registros
            </caption>
            <thead>
              <tr>
                <th>Compañero</th>
                <th>Pokédex</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="table-product">
                      <ProductImage product={p} />
                      <Link to={`/productos/${p.id}`}>
                        {p.name}
                        <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  </td>
                  <td>
                    <span className="table-dex">{dexNumber(p.pokemonId)}</span>
                    <small>{p.pokemonName}</small>
                  </td>
                  <td className="table-price">{formatPrice(p.price)}</td>
                  <td>
                    <span className={`stock-pill ${p.stock ? '' : 'out'}`}>
                      {p.stock} uds.
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="icon-button"
                        aria-label={`Editar ${p.name}`}
                        onClick={() => {
                          setEditing(p)
                          setNotice('')
                        }}
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        className="icon-button delete"
                        aria-label={`Eliminar ${p.name}`}
                        onClick={() => {
                          setDeleting(p)
                          setDeleteError('')
                        }}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {deleting && (
        <ConfirmDelete
          product={deleting}
          busy={busy}
          error={deleteError}
          onCancel={() => setDeleting(null)}
          onConfirm={remove}
        />
      )}
    </div>
  )
}
