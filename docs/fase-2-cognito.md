# Fase 2: Cognito y autenticación del frontend

## Alcance y estado

Implementación local preparada para validación manual por el propietario. Cognito User Pool, App Client público y grupos ADMIN/EDITOR/USER fueron creados previamente por el propietario. Esta tarea no crea recursos AWS ni despliegues. No hay commit ni push de la Fase 2.

```text
React (:3000) → AWS Amplify Auth → Amazon Cognito
React ← sesión y JWT administrados por Amplify
Axios → Authorization: Bearer <access_token> → Spring Boot (:8081) → SQLite
```

**Spring Boot todavía no valida JWT ni roles.** ProtectedRoute y la navegación por grupo protegen la experiencia del frontend, no los endpoints. Una llamada directa al backend aún puede hacer CRUD sin token. Esto es esperado y debe corregirse en la siguiente fase con Spring Security Resource Server; no exponer este backend como una API segura.

- Cognito autentica y emite tokens.
- Amplify es el SDK que usa React para comunicarse con Cognito y administrar sesión, almacenamiento y renovación.
- JWT contiene claims de identidad/autorización; el Access Token se usa para APIs y el ID Token para perfil.
- `cognito:groups` del payload del Access Token determina los grupos permitidos. Se normalizan únicamente ADMIN, EDITOR y USER; sin un grupo conocido, se deniega la navegación protegida.

## Configuración y ejecución

Desde `frontend/`, ejecutar `npm ci`, copiar `.env.example` a `.env` si no existe y configurar:

```dotenv
VITE_API_BASE_URL=http://localhost:8081/api
VITE_COGNITO_USER_POOL_ID=us-east-1_AJMAxVJD8
VITE_COGNITO_CLIENT_ID=6oe356tt07ubobr0n40v6ajovq
```

Los identificadores no son secretos. Ninguna variable VITE debe contener contraseñas, Client Secret ni credenciales AWS. `.env` está ignorado; la plantilla solo contiene configuración pública. Reiniciar `npm run dev` al cambiar variables. La región us-east-1 se deriva del User Pool ID.

El backend se ejecuta desde `backend/` con `mvn verify` y `java "-Djdk.net.unixdomain.tmpdir=." -jar target/pokepeluche-0.1.0.jar` (alternativa para el problema de sockets Windows documentado en README). No cambiar la ruta de ejecución para conservar la ubicación de SQLite.

Dependencia directa añadida: `aws-amplify` 6.22.1 (versiones transitivas fijadas en package-lock). Se usan imports modulares de `aws-amplify/auth`. No se instaló Amplify UI, CLI, Hosting ni un backend Amplify.

## Decisiones de autenticación

- Se conserva nuestro formulario y se usa `signIn` con `USER_SRP_AUTH`. No se usa Hosted/Managed Login. Aunque el App Client tiene Code Grant, scopes y callback configurados, este flujo no usa redirección OAuth, dominio Hosted ni `/auth/callback`.
- `CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED` muestra nueva contraseña, confirmación y atributos faltantes solicitados por Cognito. Se completa con `confirmSignIn({ challengeResponse, options: { userAttributes } })`. Se espera la sesión completa antes de entrar.
- Las contraseñas se mantienen únicamente en el formulario durante su entrada, se limpian tras cada intento y no se guardan ni registran. Los valores de las pruebas son fixtures ficticios y no corresponden a cuentas reales.
- La política de contraseña se valida en Cognito; no se inventa una política local distinta de la del User Pool.
- Otros desafíos (MFA, recuperación, confirmación de registro) muestran un error controlado y opción de volver al login. No se simula su resolución ni se crean usuarios desde esta app.
- AuthProvider comprueba sesión al montar y al recuperar foco. Expone usuario, loading, authenticated, grupos, hasRole, login, completeNewPassword, logout y checkSession. Un resultado tardío no puede restaurar sesión tras logout.
- Se consulta `fetchAuthSession` antes de cada petición protegida; Amplify renueva tokens cuando corresponde. Se utiliza el payload expuesto por el SDK, sin decodificación JWT manual. No se copia ningún JWT a un almacenamiento propio.
- Amplify administra su persistencia predeterminada en el navegador; por eso F5 restaura la sesión. No es una sesión exclusivamente en memoria. Un cambio de grupos en la consola puede requerir renovar sesión o cerrar y volver a entrar.
- Axios omite Authorization en GET `/public/info`, bloquea destinos ajenos a su API y cancela peticiones protegidas sin sesión en vez de enviarlas anónimamente. Un fallo de sesión/renovación retira el contenido protegido y permite volver al login.
- Logout usa `signOut()` de la sesión local y redirige a `/login`. No se solicita cierre global de todos los dispositivos.

## Matriz de navegación

| Ruta | ADMIN | EDITOR | USER | Sin sesión |
| --- | --- | --- | --- | --- |
| /productos | Sí | Sí | Sí | Login |
| /productos/:id | Sí | Sí | Sí | Login |
| /contacto | Sí | Sí | Sí | Login |
| /admin/productos | Sí | Acceso denegado | Acceso denegado | Login |

ADMIN ve Gestionar. EDITOR y USER ven Catálogo y Contacto sin Gestionar. El encabezado muestra correo, grupo y Cerrar sesión. No se monta el contenido protegido mientras se comprueba sesión ni al denegar acceso.

## Prueba manual pendiente con tus cuentas

Realiza los pasos tú mismo; no compartas contraseñas ni tokens en el chat.

1. **Sin sesión:** abre http://localhost:3000/admin/productos. Debes terminar en /login, sin productos ni formulario de gestión. Prueba también /productos, /productos/1 y /contacto.
2. **Primer acceso:** usa el correo y contraseña temporal de una cuenta aún pendiente de cambio. Debe aparecer «Una nueva contraseña». Comprueba que dos valores distintos muestran error. Introduce una nueva contraseña que cumpla la política y confirma. Debe completar el acceso; no debe aparecer gestión antes de finalizar. Si el Pool exige atributos, completa los campos mostrados.
3. **ADMIN:** entra con su cuenta. Debes ver correo, ADMIN y Gestionar. Comprueba catálogo, detalle, contacto y acceso directo a /admin/productos. Para CRUD, usa un producto de prueba con pokemonId libre y luego elimínalo.
4. **F5:** recarga /admin/productos como ADMIN. Debe aparecer brevemente la comprobación y conservar sesión y rol. Repite en catálogo con USER y EDITOR.
5. **Logout:** pulsa Cerrar sesión. Debes volver al login. Pega /admin/productos y usa Atrás: no debe mostrarse contenido privado sin volver a entrar.
6. **EDITOR:** entra con su cuenta. Debes ver EDITOR, Catálogo y Contacto; no Gestionar. Pega /admin/productos: debe mostrar acceso denegado, sin lista ni formulario de productos.
7. **USER:** repite el paso anterior con su cuenta. Debe mostrar USER y las mismas restricciones para gestión.
8. **Errores:** prueba una contraseña incorrecta de forma controlada (evita muchos intentos). Debe aparecer mensaje comprensible, limpiarse la contraseña y habilitar reintento. Una caída de red también debe producir error sin dar acceso.
9. **Renovación:** cuando venza el Access Token y siga válido el Refresh Token, una nueva petición debería renovarlo mediante Amplify. Si ya no hay sesión válida, debe retirar el acceso y pedir login. Esta comprobación temporal queda pendiente de tu sesión real.

Si el usuario ya cambió su contraseña temporal, no se repetirá NEW_PASSWORD_REQUIRED. Usa una de las cuentas de prueba que aún esté en ese estado; no restablezcas cuentas reales solo para generar una captura.

## DevTools: demostrar JWT y Bearer sin publicarlos

1. Abre DevTools → Network, limpia la lista y entra con tu cuenta. Observa las solicitudes a Cognito (`cognito-idp.us-east-1.amazonaws.com`): deben corresponder a inicio/respuesta de desafíos SRP, no a un login simulado.
2. Tras entrar, abre el catálogo y selecciona la petición GET `http://localhost:8081/api/products`. En Request Headers debe existir `Authorization: Bearer …`.
3. En Application → Local Storage → http://localhost:3000, Amplify normalmente mantiene claves con prefijo `CognitoIdentityServiceProvider` para su sesión. Inspecciona localmente `accessToken` e `idToken`; no los pegues en servicios externos ni capturas compartidas. El valor enviado por Axios debe corresponder al Access Token, no al ID Token.
4. Si tu visor local de JWT muestra claims, el Access Token debe tener `token_use: access` y `cognito:groups` con el grupo de esa cuenta. El ID Token tiene `token_use: id` y datos de perfil. No se incorporaron logs de tokens ni herramientas de decodificación propias al código.
5. GET `/api/public/info` no lleva Bearer desde el cliente Axios. Un navegador que abra directamente el endpoint tampoco agrega ese header.
6. La presencia del Bearer prueba el envío desde el cliente, **no la validación del servidor**. En esta fase el backend sigue aceptando llamadas directas sin JWT.

Oculta completamente Authorization, tokens y datos de cuentas al preparar evidencias para el informe.

## Verificación automática

Tests frontend con Amplify simulado; no autentican contra AWS. Cubren restauración/renovación, roles normalizados, rutas directas, ADMIN/EDITOR/USER, carga, credenciales rechazadas, contraseña nueva y atributos requeridos, error de política, desafíos no admitidos, logout, fallo de renovación, carrera logout/consulta y Bearer exclusivo del Access Token. Se conservan los flujos de catálogo, detalle, formulario y contacto de Fase 1; el test de login deshabilitado se actualizó al comportamiento real.

Comandos: `npm run lint`, `npm test`, `npm run build`; backend: `mvn -B -ntp verify`. La prueba real con Cognito, usuarios y cambio de contraseña queda a cargo del propietario antes de autorizar commit/push.

Referencias oficiales: [inicio por pasos](https://docs.amplify.aws/react/frontend/auth/multi-step-sign-in/) y [gestión de sesión](https://docs.amplify.aws/gen1/react/build-a-backend/auth/manage-user-session/).

## Resultado de esta implementación

31 pruebas frontend y 11 backend aprobadas; lint y build correctos. Backend iniciado y GET /api/public/info respondió HTTP 200; Vite iniciado en puerto 3000. Login revisado en escritorio y móvil (390 px, sin desbordamiento horizontal); acceso anónimo directo a /admin/productos redirigió al login. [Captura del login](capturas/fase-2-login.png).

Archivos nuevos:
- frontend/src/auth/AuthContext.js
- frontend/src/auth/AuthProvider.jsx
- frontend/src/auth/ProtectedRoute.jsx
- frontend/src/auth/UserMenu.jsx
- frontend/src/auth/config.js
- frontend/src/auth/errors.js
- frontend/src/auth/session.js
- frontend/src/test/auth.test.jsx
- frontend/src/test/api-auth.test.js
- docs/fase-2-cognito.md
- docs/capturas/fase-2-login.png
- frontend/.env (local, ignorado, solo configuración pública)

Archivos modificados:
- frontend/.env.example
- frontend/package.json y frontend/package-lock.json
- frontend/src/main.jsx y frontend/src/App.jsx
- frontend/src/api/client.js
- frontend/src/pages/Login.jsx y frontend/src/pages/AdminProducts.jsx
- frontend/src/emerald.css
- frontend/src/auth/README.md
- frontend/src/test/flows.test.jsx
- README.md
- docs/arquitectura.md, docs/requisitos.md y docs/verificacion.md

Sin cambios de código, esquema ni dependencias del backend. Sin API Gateway, Resource Server, Lambda, PokéAPI ni despliegue. La instalación inicial de npm fue bloqueada por permisos del entorno; se completó con la autorización correspondiente. La revalidación al recuperar foco se ejecuta en segundo plano para no perder formularios sin guardar. Los resultados automatizados no sustituyen la validación con las cuentas Cognito reales.
