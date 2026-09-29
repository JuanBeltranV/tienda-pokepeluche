import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Catalog from '../pages/Catalog'
import ProductDetail from '../pages/ProductDetail'
import ProductForm from '../components/ProductForm'
import Contact from '../pages/Contact'
import Login from '../pages/Login'
import AuthProvider from '../auth/AuthProvider'
import { productsApi } from '../api/products'
import { contactApi } from '../api/contact'

vi.mock('../api/products', () => ({
  productsApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}))
vi.mock('../api/contact', () => ({ contactApi: { create: vi.fn() } }))
vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: async () => ({}),
  getCurrentUser: vi.fn(),
  signIn: vi.fn(),
  confirmSignIn: vi.fn(),
  signOut: vi.fn(),
}))
vi.mock('aws-amplify/utils', () => ({ Hub: { listen: () => () => {} } }))
vi.mock('../auth/config', () => ({
  authConfigured: true,
  requireAuthConfig: vi.fn(),
}))
const product = {
  id: 1,
  name: 'Peluche Pikachu 30 cm',
  description: 'Un compañero suave.',
  price: 19990,
  stock: 10,
  imageUrl: '/images/plush-yellow.svg',
  pokemonId: 25,
  pokemonName: 'pikachu',
}
const wrapped = (component) => render(<MemoryRouter>{component}</MemoryRouter>)

beforeEach(() => vi.resetAllMocks())

describe('Flujos de la Fase 1', () => {
  it('consume el catálogo y filtra sin crear productos ficticios en React', async () => {
    productsApi.list.mockResolvedValue([product])
    wrapped(<Catalog />)
    expect(
      await screen.findByRole('link', { name: /Peluche Pikachu/ }),
    ).toHaveAttribute('href', '/productos/1')
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Buscar peluche' }),
      'squirtle',
    )
    expect(
      screen.getByText('No encontramos ese compañero.'),
    ).toBeInTheDocument()
  })

  it('permite reintentar tras un fallo de comunicación', async () => {
    productsApi.list
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce([product])
    wrapped(<Catalog />)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos conectar',
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Volver a intentar' }),
    )
    expect(
      await screen.findByRole('link', { name: /Peluche Pikachu/ }),
    ).toBeInTheDocument()
  })

  it('abre un detalle por URL y reserva la información Pokédex', async () => {
    productsApi.get.mockResolvedValue(product)
    render(
      <MemoryRouter initialEntries={['/productos/1']}>
        <Routes>
          <Route path="/productos/:id" element={<ProductDetail />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(
      await screen.findByRole('heading', { name: product.name }),
    ).toBeInTheDocument()
    expect(productsApi.get).toHaveBeenCalledWith('1', expect.any(AbortSignal))
    expect(
      screen.getByText(/Información Pokédex disponible próximamente/),
    ).toBeInTheDocument()
  })

  it('muestra el error de producto inexistente', async () => {
    productsApi.get.mockRejectedValue({
      response: { status: 404, data: { detail: 'No existe el producto 99.' } },
    })
    render(
      <MemoryRouter initialEntries={['/productos/99']}>
        <Routes>
          <Route path="/productos/:id" element={<ProductDetail />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No existe el producto 99.',
    )
  })

  it('conserva el formulario cuando el servidor rechaza un Pokémon duplicado', async () => {
    productsApi.update.mockRejectedValue({
      response: {
        status: 409,
        data: { detail: 'El Pokémon #25 ya tiene un producto asociado.' },
      },
    })
    const onSaved = vi.fn()
    render(
      <ProductForm product={product} onSaved={onSaved} onCancel={vi.fn()} />,
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Guardar cambios' }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'ya tiene un producto asociado',
    )
    expect(screen.getByLabelText('Nombre del peluche')).toHaveValue(
      product.name,
    )
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('envía solo los campos editables y espera la confirmación del servidor', async () => {
    productsApi.update.mockResolvedValue(product)
    const onSaved = vi.fn()
    render(
      <ProductForm product={product} onSaved={onSaved} onCancel={vi.fn()} />,
    )
    await userEvent.clear(screen.getByLabelText('Stock'))
    await userEvent.type(screen.getByLabelText('Stock'), '3')
    await userEvent.click(
      screen.getByRole('button', { name: 'Guardar cambios' }),
    )
    const { id: _id, ...expected } = product
    expect(productsApi.update).toHaveBeenCalledWith(1, {
      ...expected,
      stock: 3,
    })
    expect(onSaved).toHaveBeenCalledWith(product)
  })

  it('envía contacto y confirma el guardado', async () => {
    contactApi.create.mockResolvedValue({ id: 1 })
    wrapped(<Contact />)
    await userEvent.type(screen.getByLabelText('Tu nombre'), 'Ana')
    await userEvent.type(
      screen.getByLabelText('Correo electrónico'),
      'ana@example.com',
    )
    await userEvent.type(screen.getByLabelText('Asunto'), 'Consulta')
    await userEvent.type(
      screen.getByLabelText('Tu mensaje'),
      'Hola, compañeros.',
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Enviar mensaje' }),
    )
    expect(await screen.findByRole('status')).toHaveTextContent(
      '¡Mensaje recibido!',
    )
    expect(contactApi.create).toHaveBeenCalledWith({
      name: 'Ana',
      email: 'ana@example.com',
      subject: 'Consulta',
      message: 'Hola, compañeros.',
    })
  })

  it('presenta el login real sin credenciales precargadas', async () => {
    wrapped(
      <AuthProvider>
        <Login />
      </AuthProvider>,
    )
    expect(
      await screen.findByRole('button', { name: /Iniciar sesión/ }),
    ).toBeEnabled()
    expect(screen.getByLabelText('Contraseña')).toHaveValue('')
    expect(screen.getByText(/Amazon Cognito/)).toBeInTheDocument()
  })
})
