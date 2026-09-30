import { useEffect, useState } from 'react'
import { contactApi } from '../api/contact'
import { errorMessage } from '../api/client'
import { notifySessionFailure } from '../auth/session'
import { ErrorNotice, Loading } from '../components/Feedback'

const dateFormat = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export default function ContactMessages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    contactApi.list(controller.signal).then(
      (data) => {
        if (controller.signal.aborted) return
        setMessages(data)
        setLoading(false)
      },
      (err) => {
        if (controller.signal.aborted) return
        if (err.response?.status === 401) notifySessionFailure()
        setError(
          err.response?.status === 403
            ? 'Tu cuenta no tiene permiso para leer los mensajes recibidos.'
            : !err.response && err.name !== 'SessionUnavailableError'
              ? 'No pudimos obtener los mensajes. Comprueba tu conexión e inténtalo de nuevo.'
              : errorMessage(err),
        )
        setLoading(false)
      },
    )
    return () => controller.abort()
  }, [attempt])

  function retry() {
    setError('')
    setLoading(true)
    setAttempt((value) => value + 1)
  }

  return (
    <div className="page messages-page">
      <div className="section-heading page-heading">
        <div>
          <span className="eyebrow">EL BUZÓN DE LA RUTA</span>
          <h1>Mensajes recibidos</h1>
          <p>Saludos, preguntas e ideas de nuestros entrenadores.</p>
        </div>
      </div>
      {loading ? (
        <Loading label="Cargando mensajes…" />
      ) : error ? (
        <ErrorNotice message={error} onRetry={retry} />
      ) : !messages.length ? (
        <div className="empty-state" role="status">
          <h2>El buzón está vacío.</h2>
          <p>Los mensajes enviados desde Contacto aparecerán aquí.</p>
        </div>
      ) : (
        <ul className="received-messages" aria-label="Mensajes recibidos">
          {messages.map((message) => (
            <li
              key={message.id}
              className="contact-form-panel received-message"
            >
              <h2>{message.subject}</h2>
              <dl className="message-details">
                <div>
                  <dt>Fecha</dt>
                  <dd>
                    <time dateTime={message.createdAt}>
                      {dateFormat.format(new Date(message.createdAt))}
                    </time>
                  </dd>
                </div>
                <div>
                  <dt>Nombre</dt>
                  <dd>{message.name}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{message.email}</dd>
                </div>
              </dl>
              <p className="received-message-body">{message.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
