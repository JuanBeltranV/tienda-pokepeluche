# Arquitectura y evolución

## Implementado: Fase 1

React renderiza rutas SPA y llama a servicios en `src/api`. `client.js` contiene baseURL y timeout; Axios no usa token todavía. Componentes y páginas no conocen credenciales ni SDKs AWS. `PokemonFields` aísla el ingreso manual que será reemplazado después. `ProductImage` resuelve fallos de imágenes con un SVG local.

Spring MVC recibe DTOs con Bean Validation. Los controladores delegan al servicio; los servicios delimitan transacciones y consultan repositorios JPA; las entidades representan las tablas. El listado se ordena por pokemonId; contactos por fecha descendente. Los DTOs impiden que el cliente elija IDs o fechas de servidor. Los errores de negocio se traducen a 404/409 y validaciones a 400 con ProblemDetail.

SQLite se crea automáticamente con una ruta relativa al directorio de ejecución. Un pool de una conexión reduce conflictos de escritura propios del entorno local. Se configura busy_timeout de 5 segundos. JPA crea tablas; `schema.sql` crea el índice único; el inicializador inserta solo si `products` está vacío. No hay datos de catálogo simulados en React. Los fixtures del frontend existen únicamente en tests aislados.

## Planificado: seguridad y AWS

| Recurso | GET | POST | PUT/DELETE |
| --- | --- | --- | --- |
| /api/public/info | Público | No implementado | No implementado |
| /api/products y detalle | ADMIN, EDITOR, USER | ADMIN | ADMIN |
| /api/contact | ADMIN, EDITOR | ADMIN, EDITOR, USER | No implementado |

La siguiente fase añadirá Cognito sin Client Secret en la SPA, usuarios de prueba por grupo y gestión del ciclo de vida de JWT. El token se adjuntará desde un interceptor único. AuthContext y ProtectedRoute controlarán la experiencia del cliente; la autorización efectiva estará en Spring Security con JwtAuthenticationConverter para `cognito:groups`. Gateway validará emisor y audiencia mediante JWT Authorizer. La forma exacta de manejar access/ID tokens y renovación se decidirá al configurar Cognito, evitando copiar secretos o tokens a documentación.

La integración HTTP exige una dirección alcanzable desde AWS. La protección del origen, CORS y caminos públicos/privados se comprobarán de extremo a extremo en esa fase. No se considera segura una API solo por tener CORS.

## Planificado: Lambda/PokéAPI

Responsabilidades y contrato en [lambda/README.md](../lambda/README.md). La SPA consultará una ruta Gateway que invocará Lambda, nunca PokéAPI directamente. La Lambda devuelve solo el ID canónico, nombre, tipos, sprite, altura y peso normalizados. No modifica stock ni precios. Se usará tanto al crear/editar como al mostrar detalle.

El buscador no permitirá guardar una selección inexistente. Aun así, se deberá resolver cómo asegurar esa regla en el servidor ante llamadas directas que eviten el navegador. La unicidad persistida no prueba que un número exista: son dos invariantes diferentes.

## Fuera de alcance

Carrito, ventas, cobros, pedidos, logística, cupones, autenticación casera, roles simulados, despliegue en esta fase y recursos AWS creados anticipadamente.
