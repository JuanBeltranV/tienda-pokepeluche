# Fase 3: Spring Security OAuth2 Resource Server y RBAC

## Estado y arquitectura

Partimos de `708f4b1`, Fase 2 validada manualmente por el propietario con ADMIN, EDITOR y USER. Esta fase agrega seguridad efectiva al backend. El propietario confirmó el 29 de septiembre de 2026 la validación con las cuentas reales ADMIN, EDITOR y USER, los estados 200/401/403 y el CRUD ADMIN, y autorizó commit y push a main. Las evidencias fueron guardadas para el informe.

```text
React (:3000) → Amplify Auth → Amazon Cognito
React ← sesión / Access Token JWT
Axios → Authorization: Bearer <Access Token>
        ↓
Spring Security OAuth2 Resource Server (:8081)
        verifica firma y claims
        convierte cognito:groups → ROLE_*
        autoriza según método y ruta
        ↓
Controllers → Services → Repositories → SQLite
```

Un Resource Server protege recursos de una API y verifica tokens emitidos por un servidor de autorización, Cognito en este caso. No inicia sesión ni recibe contraseñas: el login continúa en React mediante Amplify.

La protección del frontend controla navegación y visibilidad. Puede eludirse llamando directamente a la API; por eso las decisiones finales ahora se toman en Spring con el JWT validado, no con roles enviados por el navegador.

## Configuración

Dependencias nuevas, sin versiones propias (administradas por Spring Boot 3.5.11):

- `spring-boot-starter-oauth2-resource-server`: incorpora Security, Resource Server y JOSE/Nimbus para verificar JWT.
- `spring-security-test`: únicamente para pruebas.

`application.properties` permite sobrescribir estos valores públicos de desarrollo mediante variables del proceso:

```text
COGNITO_ISSUER_URI=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_AJMAxVJD8
COGNITO_CLIENT_ID=6oe356tt07ubobr0n40v6ajovq
```

La primera alimenta `spring.security.oauth2.resourceserver.jwt.issuer-uri`; la segunda `app.security.cognito-client-id`. No se requiere archivo .env del backend, ni se carga automáticamente uno. No hay Client Secret. El frontend conserva su .env ignorado y sus dos identificadores Cognito.

Ejemplo PowerShell, solo para cambiar configuración antes de iniciar desde `backend/`:

```powershell
$env:COGNITO_ISSUER_URI = 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_AJMAxVJD8'
$env:COGNITO_CLIENT_ID = '6oe356tt07ubobr0n40v6ajovq'
mvn -B -ntp verify
java '-Djdk.net.unixdomain.tmpdir=.' -jar target/pokepeluche-0.1.0.jar
```

Si ya hay un proceso Java usando ese JAR, detenerlo antes de empaquetar (Windows bloquea su reemplazo). Conservar la base SQLite. En otra terminal desde `frontend/`: `npm ci` si faltan dependencias y `npm run dev`.

## Estrategia de validación JWT

`SecurityConfig` crea `NimbusJwtDecoder.withIssuerLocation(issuer)`. Spring descubre la configuración OpenID/JWKS y obtiene/cachea las claves públicas de Cognito, con soporte de rotación de claves. No hay descarga manual, claves Cognito guardadas ni verificación criptográfica propia. Este bean hace discovery al iniciar: se necesita conexión al issuer para arrancar; una caída inicial falla de forma cerrada, sin abrir la API.

Se exige:

1. Firma RSA válida con algoritmo RS256, usando Nimbus/Spring.
2. Issuer exacto mediante `JwtValidators.createDefaultWithIssuer`.
3. Expiración (`exp`) presente y vigente; también `nbf` si está presente. Se conserva la tolerancia de reloj predeterminada de Spring (60 segundos).
4. `token_use` exactamente `access`, mediante `JwtClaimValidator`.
5. `client_id` exactamente igual al App Client configurado, mediante `JwtClaimValidator`. En Access Tokens Cognito se comprueba `client_id`, no el `aud` del ID Token.

Un ID Token se rechaza aunque tenga firma válida. Sirve para identidad/perfil del cliente, no para autorizar esta API. Los roles no sustituyen las validaciones anteriores.

Límite: la comprobación local de firma/claims no consulta la revocación de cada token en Cognito. Un Access Token ya emitido puede seguir siendo aceptado hasta su expiración aunque se haya cerrado sesión. Los cambios de grupo se reflejan al emitir/renovar tokens. No se añadió una lista de revocación ni introspección en esta fase.

## Grupos y permisos

`cognito:groups` es el claim de grupos emitido por Cognito. `CognitoAuthoritiesConverter` transforma una colección de cadenas en authorities: ADMIN → ROLE_ADMIN, EDITOR → ROLE_EDITOR y USER → ROLE_USER. Elimina duplicados y entradas vacías/no textuales; si falta el claim o tiene forma inválida devuelve una colección vacía. Un grupo desconocido no coincide con las reglas. No usa headers X-Role, campos JSON ni un claim arbitrario `roles` para conceder acceso.

`JwtAuthenticationConverter` conecta esa conversión con la autenticación JWT de Spring. `hasRole("ADMIN")` compara con ROLE_ADMIN. Un token válido sin grupos reconocidos está autenticado, pero no autorizado para los endpoints protegidos.

| Método / ruta | Sin token | USER | EDITOR | ADMIN |
| --- | --- | --- | --- | --- |
| GET /api/public/** | Permitido | Permitido | Permitido | Permitido |
| GET /api/products | 401 | 200 | 200 | 200 |
| GET /api/products/{id} | 401 | Permitido | Permitido | Permitido |
| POST /api/products | 401 | 403 | 403 | Permitido |
| PUT /api/products/{id} | 401 | 403 | 403 | Permitido |
| DELETE /api/products/{id} | 401 | 403 | 403 | Permitido |
| POST /api/contact | 401 | Permitido | Permitido | Permitido |
| GET /api/contact | 401 | 403 | 200 | 200 |

Permitido significa que se ejecuta la lógica normal: por ejemplo creación válida 201, actualización 200, eliminación 204, datos inválidos 400, ID inexistente 404 o duplicado 409. Las rutas/métodos no declarados se deniegan por defecto. Solo se permite el despacho interno ERROR para preservar respuestas de MVC; una llamada directa a /error no es pública.

- **Autenticación:** comprobar que el token es válido y reconocer su identidad.
- **Autorización:** comprobar si esa identidad tiene un rol habilitado para la operación.
- **401:** falta Bearer o el JWT es inválido, vencido, de otro issuer/client o no es Access Token. Incluye `WWW-Authenticate: Bearer`.
- **403:** hay autenticación válida, pero faltan permisos.

Ambas respuestas llevan JSON `application/problem+json` con `status`, `title`, `detail` y `type`, sin detalles del decoder ni tokens. El cliente Axios existente ya muestra `detail`, por lo que no se modificó la lógica de sesión/login/interceptor. Si un token es rechazado por el servidor, el mensaje indica iniciar sesión otra vez; no hay bucles automáticos de reintento.

## Stateless, CSRF y CORS

La API usa `SessionCreationPolicy.STATELESS`, sin formLogin, HTTP Basic, logout Spring ni caché de requests. No crea sesión HTTP para autenticar y no usa cookies de login. CSRF está deshabilitado porque las credenciales son Bearer explícito y no cookies adjuntadas automáticamente por el navegador; si se añadiera autenticación por cookies habría que revisar esa decisión.

CORS se integra en la cadena de seguridad y reutiliza `WebConfig`: únicamente http://localhost:3000, métodos GET/POST/PUT/DELETE/OPTIONS y headers Content-Type/Authorization. El preflight válido no necesita token; las respuestas 401/403 para ese origen conservan CORS. No se abrió OPTIONS indiscriminadamente ni se usó anyRequest().permitAll().

## Tests sin Cognito real

- Los 11 tests previos de negocio usan ADMIN simulado y filtros activos. La prueba pública es anónima. Persisten en SQLite temporal real.
- SecurityIntegrationTest utiliza un decoder sustituido solo en tests para evitar discovery remoto. Los requests Bearer pasan por los filtros, JwtAuthenticationConverter, reglas RBAC, controladores y SQLite reales. Cubre toda la matriz, multigrupo, claim ausente/malformado, roles enviados por headers ignorados, 401 de decoder, métodos no previstos, CORS y ausencia de sesión HTTP.
- CognitoJwtTest usa Nimbus con claves RSA efímeras generadas en memoria. Verifica firma correcta/incorrecta, issuer, exp/nbf, exp ausente, token_use access/id/ausente y client_id válido/incorrecto/ausente. No contiene claves ni JWT reales guardados.

No se desactivan filtros ni se abren rutas para hacer pasar tests. Las pruebas no se conectan a AWS. El descubrimiento real se verifica al arrancar la aplicación; la aceptación de los JWT de las tres cuentas la valida el propietario.

## Prueba manual desde la aplicación

Usa tus cuentas reales tú mismo, sin compartir contraseñas ni tokens.

1. Abre http://localhost:3000 y entra como USER. Catálogo y detalle deben cargar. Envía un contacto de prueba con datos ficticios: debe confirmar el guardado. No debe aparecer Gestionar; /admin/productos debe mostrar acceso denegado.
2. Cierra sesión y entra como EDITOR. Repite catálogo y contacto; tampoco puede administrar productos. Para leer mensajes usa la prueba de consola descrita abajo: no se agregó una bandeja al frontend.
3. Cierra sesión y entra como ADMIN. Gestionar debe funcionar. Crea un producto de prueba con pokemonId libre, edita su stock, comprueba el detalle y elimina ese registro de prueba. No elimines los productos que quieras conservar. GET /api/contact debe estar permitido.
4. En cada cuenta recarga con F5 para comprobar sesión y peticiones con Bearer. En Network comprueba los códigos HTTP; un error CORS sería una regresión, no un 401/403 esperado.

## Prueba real de API en DevTools sin copiar JWT

En la página local de Vite (localhost:3000), abre DevTools → Console. El siguiente código solo funciona en desarrollo; importa el cliente Axios existente y deja que Amplify obtenga el Access Token. No lee ni imprime tokens, no modifica roles y no evade la seguridad del servidor.

```javascript
var apiFase3 = (await import('/src/api/client.js')).api;
var comprobarFase3 = async (method, url, data) => {
  try {
    var response = await apiFase3.request({ method, url, data });
    console.log(method.toUpperCase(), url, response.status);
  } catch (error) {
    console.log(method.toUpperCase(), url, error.response?.status ?? 'sin respuesta');
  }
};
```

Con cada cuenta, ejecuta estos comandos (sin imprimir el objeto response/error completo):

```javascript
await comprobarFase3('get', '/products');
await comprobarFase3('get', '/contact');
await comprobarFase3('post', '/products', {});
```

Resultados esperados:

| Cuenta | GET products | GET contact | POST products con JSON vacío |
| --- | --- | --- | --- |
| USER | 200 | 403 | 403 |
| EDITOR | 200 | 200 | 403 |
| ADMIN | 200 | 200 | 400 |

El POST vacío es deliberado para probar la autorización **sin crear productos accidentalmente**: ADMIN supera seguridad pero la validación del DTO devuelve 400; USER/EDITOR se detienen antes en 403. Para demostrar éxito ADMIN (201/200/204), realiza el CRUD de prueba desde Gestionar y captura Network. Para comprobar lectura EDITOR basta el 200 de contacto; no imprimas ni compartas los mensajes reales de otros usuarios.

Después de F5 vuelve a ejecutar la definición del ayudante, porque la consola pierde sus variables. Al cambiar de cuenta, Axios toma la sesión actual y no reutiliza un JWT copiado.

Sin token, independientemente de la cuenta abierta:

```javascript
console.log('public sin token', (await fetch('http://localhost:8081/api/public/info', { credentials: 'omit' })).status);
console.log('products sin token', (await fetch('http://localhost:8081/api/products', { credentials: 'omit' })).status);
console.log('contact sin token', (await fetch('http://localhost:8081/api/contact', { credentials: 'omit' })).status);
```

Deben devolver 200, 401 y 401. `fetch` no usa el interceptor Axios ni agrega automáticamente el Bearer. Alternativa local PowerShell: `curl.exe -i http://localhost:8081/api/public/info` y `curl.exe -i http://localhost:8081/api/products`.

## Evidencias recomendadas

- Endpoint público con 200 sin Authorization y productos sin token con 401.
- USER: consola mostrando POST products 403 y GET contact 403; ocultar respuestas de contacto y datos de perfil.
- EDITOR: GET contact 200 y POST products 403.
- ADMIN: Network mostrando creación 201, edición 200 y eliminación 204 del producto de prueba.
- Request Headers mostrando el nombre Authorization y prefijo Bearer, **con todo el valor del token oculto**. Para el informe es preferible mostrar solo la lista de requests con sus estados y un recorte redactado por separado.
- Fragmentos de SecurityConfig, converter y resumen de tests. No activar logs de JWT ni pegar tokens en decodificadores externos.

El Bearer visible en Network prueba envío; firma/claims y RBAC están respaldados por el Resource Server, las pruebas y las respuestas diferentes a cada rol.

## Inventario de cambios

Archivos creados:

- `backend/src/main/java/cl/pokepeluche/config/SecurityConfig.java`
- `backend/src/main/java/cl/pokepeluche/config/CognitoJwtValidators.java`
- `backend/src/main/java/cl/pokepeluche/config/CognitoAuthoritiesConverter.java`
- `backend/src/test/java/cl/pokepeluche/SecurityIntegrationTest.java`
- `backend/src/test/java/cl/pokepeluche/CognitoJwtTest.java`
- `docs/fase-3-resource-server.md`

Archivos modificados:

- `backend/pom.xml`
- `backend/src/main/resources/application.properties`
- `backend/src/main/java/cl/pokepeluche/controller/PublicController.java`
- `backend/src/test/java/cl/pokepeluche/ApiIntegrationTest.java`
- `frontend/src/pages/AdminProducts.jsx` (solo texto informativo)
- `frontend/src/auth/README.md`
- `README.md`
- `docs/arquitectura.md`
- `docs/requisitos.md`
- `docs/fase-2-cognito.md`
- `docs/verificacion.md`

Resultados y problema de empaquetado resuelto: [registro de verificación](verificacion.md#verificación-de-fase-3-28-de-septiembre-de-2026).

## Trabajo pendiente

API Gateway + JWT Authorizer + CORS AWS; Lambda/PokéAPI; despliegue e informe académico final. No se modificaron recursos Cognito ni otras infraestructuras AWS.

Referencias oficiales: [Spring Security JWT Resource Server 6.5](https://docs.spring.io/spring-security/reference/6.5/servlet/oauth2/resource-server/jwt.html) y [verificación JWT Cognito](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html).
