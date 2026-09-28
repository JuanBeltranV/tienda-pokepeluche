# Seguridad planificada

Esta carpeta reserva el lugar de `AuthContext` y `ProtectedRoute` para la Fase 2.
No hay sesión, usuarios ficticios, token ni permisos simulados en la Fase 1.
Las rutas actuales son públicas para probar la aplicación local.

Después: Cognito (App Client sin secret), estado de sesión en memoria,
ProtectedRoute para las rutas privadas y ADMIN para el mantenedor.
El interceptor Bearer se añadirá a `src/api/client.js`. La autorización efectiva
debe comprobarse también en Spring Security y API Gateway, no solo en React.
