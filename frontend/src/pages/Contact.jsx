import { useState } from 'react'
import { ArrowRight, CheckCircle2, MessageSquare } from 'lucide-react'
import { contactApi } from '../api/contact'
import { errorMessage } from '../api/client'
import { ErrorNotice, Field } from '../components/Feedback'

const initial = { name: '', email: '', subject: '', message: '' }
export default function Contact() {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)
  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setErrors({})
    try {
      await contactApi.create(
        Object.fromEntries(
          Object.entries(values).map(([key, value]) => [key, value.trim()]),
        ),
      )
      setSent(true)
      setValues(initial)
    } catch (err) {
      setError(errorMessage(err))
      setErrors(err.response?.data?.errors || {})
    } finally {
      setBusy(false)
    }
  }
  const input = (name, attrs = {}) => ({
    id: name,
    name,
    required: true,
    value: values[name],
    onChange: (e) => setValues({ ...values, [name]: e.target.value }),
    'aria-invalid': !!errors[name],
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
    ...attrs,
  })
  return (
    <div className="page contact-page">
      <div className="contact-intro">
        <span className="eyebrow">ESTAMOS AL OTRO LADO DE LA RUTA</span>
        <h1>
          ¡Hola, <em>compañero!</em>
        </h1>
        <p>
          Las mejores aventuras se comparten.
          <br />
          Déjanos tu pregunta, idea o simplemente un saludo.
        </p>
        <div className="contact-illustration" aria-hidden="true">
          {imageFailed ? (
            <>
              <MessageSquare size={64} strokeWidth={1.3} />
              <span>✦</span>
            </>
          ) : (
            <img
              src="/images/imagencontacto.png"
              alt=""
              onError={() => setImageFailed(true)}
            />
          )}
        </div>
      </div>
      <section className="contact-form-panel">
        <h2>Hablemos</h2>
        {sent ? (
          <div className="sent-state" role="status">
            <CheckCircle2 size={40} />
            <h3>¡Mensaje recibido!</h3>
            <p>Tu mensaje quedó guardado correctamente.</p>
            <button className="button secondary" onClick={() => setSent(false)}>
              Escribir otro mensaje
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <ErrorNotice message={error} />
            <fieldset disabled={busy} className="form-fields">
              <Field label="Tu nombre" name="name" errors={errors}>
                <input
                  {...input('name', {
                    maxLength: 100,
                    autoComplete: 'name',
                    placeholder: '¿Cómo te llamas?',
                  })}
                />
              </Field>
              <Field label="Correo electrónico" name="email" errors={errors}>
                <input
                  {...input('email', {
                    type: 'email',
                    maxLength: 254,
                    autoComplete: 'email',
                    placeholder: 'tu@correo.cl',
                  })}
                />
              </Field>
              <Field label="Asunto" name="subject" errors={errors}>
                <input
                  {...input('subject', {
                    maxLength: 150,
                    placeholder: '¿De qué te gustaría hablar?',
                  })}
                />
              </Field>
              <Field label="Tu mensaje" name="message" errors={errors}>
                <textarea
                  {...input('message', {
                    maxLength: 3000,
                    rows: 5,
                    placeholder: 'Tu aventura empieza aquí…',
                  })}
                />
              </Field>
              <button className="button primary" type="submit">
                {busy ? 'Enviando…' : 'Enviar mensaje'}
                <ArrowRight size={17} />
              </button>
            </fieldset>
          </form>
        )}
      </section>
    </div>
  )
}
