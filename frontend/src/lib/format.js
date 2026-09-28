export const formatPrice = (price) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(price)
export const dexNumber = (id) => `#${String(id).padStart(3, '0')}`
