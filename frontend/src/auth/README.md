# Autenticación del frontend

Implementada con AWS Amplify Auth y el User Pool Cognito existente. Ver [configuración, decisiones y pruebas manuales](../../../docs/fase-2-cognito.md).

- config.js configura Amplify desde VITE_COGNITO_USER_POOL_ID y VITE_COGNITO_CLIENT_ID.
- AuthContext.js expone useAuth; AuthProvider.jsx administra identidad, grupos, carga, sesión y desafíos.
- session.js consulta tokens del SDK, normaliza grupos y comunica fallos de sesión a React.
- ProtectedRoute.jsx aplica la matriz de rutas del frontend sin montar contenido denegado.
- UserMenu.jsx muestra identidad, grupos y cierre de sesión.
- errors.js traduce errores sin revelar respuestas ni tokens.

El interceptor en src/api/client.js obtiene el Access Token antes de cada petición protegida. Amplify administra almacenamiento y renovación; no hay almacenamiento manual de JWT ni logs de credenciales.

Spring Boot todavía NO valida tokens ni roles. La protección efectiva de APIs mediante Resource Server y API Gateway está pendiente para otra fase.
