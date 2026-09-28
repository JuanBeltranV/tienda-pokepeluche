import { useEffect, useRef } from 'react'
import { Trash2 } from 'lucide-react'
import { ErrorNotice } from './Feedback'

export default function ConfirmDelete({
  product,
  onCancel,
  onConfirm,
  busy,
  error,
}) {
  const ref = useRef(null)
  useEffect(() => {
    ref.current.showModal()
  }, [])
  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      aria-labelledby="delete-title"
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onCancel()
      }}
    >
      <span className="dialog-icon">
        <Trash2 size={24} />
      </span>
      <h2 id="delete-title">¿Eliminar este compañero?</h2>
      <p>
        Se eliminará <strong>{product.name}</strong> del catálogo. Esta acción
        no se puede deshacer.
      </p>
      <ErrorNotice message={error} />
      <div className="form-actions">
        <button
          autoFocus
          className="button secondary"
          onClick={onCancel}
          disabled={busy}
        >
          Conservar producto
        </button>
        <button className="button danger" onClick={onConfirm} disabled={busy}>
          {busy ? 'Eliminando…' : 'Eliminar producto'}
        </button>
      </div>
    </dialog>
  )
}
