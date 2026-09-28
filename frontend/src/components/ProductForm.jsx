import { useState } from 'react'
import { Save } from 'lucide-react'
import { productsApi } from '../api/products'
import { errorMessage } from '../api/client'
import { ErrorNotice, Field } from './Feedback'
import PokemonFields from './PokemonFields'

const empty = {
  name: '',
  description: '',
  price: '',
  stock: '',
  imageUrl: '/images/plush-sage.svg',
  pokemonId: '',
  pokemonName: '',
}

export default function ProductForm({ product, onSaved, onCancel }) {
  const [values, setValues] = useState(
    product
      ? Object.fromEntries(Object.keys(empty).map((key) => [key, product[key]]))
      : empty,
  )
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const onChange = (event) =>
    setValues({ ...values, [event.target.name]: event.target.value })
  const input = (name, attributes = {}) => ({
    id: name,
    name,
    value: values[name],
    onChange,
    required: true,
    'aria-invalid': !!errors[name],
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
    ...attributes,
  })

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setErrors({})
    const payload = {
      ...values,
      name: values.name.trim(),
      description: values.description.trim(),
      pokemonName: values.pokemonName.trim().toLowerCase(),
      imageUrl: values.imageUrl.trim(),
      price: Number(values.price),
      stock: Number(values.stock),
      pokemonId: Number(values.pokemonId),
    }
    try {
      const saved = product
        ? await productsApi.update(product.id, payload)
        : await productsApi.create(payload)
      onSaved(saved)
    } catch (err) {
      setError(errorMessage(err))
      setErrors(err.response?.data?.errors || {})
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="product-form">
      <ErrorNotice message={error} />
      <fieldset disabled={saving} className="form-fields">
        <Field label="Nombre del peluche" name="name" errors={errors}>
          <input
            {...input('name', {
              maxLength: 120,
              placeholder: 'ej. Peluche Pikachu 30 cm',
            })}
          />
        </Field>
        <Field label="Descripción" name="description" errors={errors}>
          <textarea {...input('description', { maxLength: 2000, rows: 3 })} />
        </Field>
        <div className="form-row">
          <Field label="Precio (CLP)" name="price" errors={errors}>
            <input
              {...input('price', {
                type: 'number',
                min: 1,
                max: 999999999,
                step: 1,
              })}
            />
          </Field>
          <Field label="Stock" name="stock" errors={errors}>
            <input
              {...input('stock', {
                type: 'number',
                min: 0,
                max: 999999,
                step: 1,
              })}
            />
          </Field>
        </div>
        <Field
          label="Imagen"
          name="imageUrl"
          errors={errors}
          hint="Ruta /images/archivo.svg o URL HTTPS. No se suben archivos."
        >
          <input
            {...input('imageUrl', {
              maxLength: 2048,
              'aria-describedby': errors.imageUrl
                ? 'imageUrl-error imageUrl-hint'
                : 'imageUrl-hint',
            })}
          />
        </Field>
        <PokemonFields values={values} onChange={onChange} errors={errors} />
        <div className="form-actions">
          <button className="button primary" type="submit">
            <Save size={17} />
            {saving
              ? 'Guardando…'
              : product
                ? 'Guardar cambios'
                : 'Crear producto'}
          </button>
          <button className="button secondary" type="button" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </fieldset>
    </form>
  )
}
