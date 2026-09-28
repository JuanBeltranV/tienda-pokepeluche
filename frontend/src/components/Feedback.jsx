import { AlertCircle, LoaderCircle } from 'lucide-react'

export function ErrorNotice({ message, onRetry }) {
  if (!message) return null
  return (
    <div className="notice error" role="alert">
      <AlertCircle size={20} />
      <div>
        {message}
        {onRetry && (
          <button className="text-button" onClick={onRetry}>
            Volver a intentar
          </button>
        )}
      </div>
    </div>
  )
}

export function Loading({ label = 'Buscando compañeros…' }) {
  return (
    <div className="empty-state" role="status">
      <LoaderCircle className="spin" size={30} />
      <p>{label}</p>
    </div>
  )
}

export function Field({ label, name, errors = {}, children, hint }) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {children}
      {hint && <small id={`${name}-hint`}>{hint}</small>}
      {errors[name] && (
        <small className="field-error" id={`${name}-error`}>
          {errors[name]}
        </small>
      )}
    </div>
  )
}
