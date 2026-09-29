# PokePeluche

Catálogo ficticio y sistema de gestión de peluches asociados a Pokémon. Proyecto de la **Actividad Sumativa Nº1: Diseño e Implementación de APIs Seguras con Spring Boot, React, SQLite, AWS Cognito y API Gateway**.

**Estado: Fase 3 Resource Server implementada y validada manualmente con las cuentas reales de Cognito.** Fase 2 fue validada por el propietario y publicada en 708f4b1. Spring ahora verifica Access Tokens Cognito y aplica RBAC; API Gateway, Lambda/PokéAPI, despliegue e informe final siguen pendientes. Ver [guía Fase 3 y pruebas exactas](docs/fase-3-resource-server.md).

## Alcance implementado

- Spring Boot 3 en `http://localhost:8081`, arquitectura Controller → Service → Repository → Entity.
- SQLite real (`backend/productos_db.db` al ejecutar desde `backend/`), productos y mensajes de contacto.
- CRUD de productos, detalle, validación de datos, errores HTTP y `pokemonId` único en la base. Spring Security verifica JWT y restringe operaciones según ADMIN/EDITOR/USER.
- React SPA en `http://localhost:3000`, React Router DOM y Axios centralizado.
- Catálogo, búsqueda local del catálogo, detalle, gestión de productos y formulario de contacto.
- Login propio con Amplify Auth y Cognito: SRP, contraseña temporal/cambio obligatorio, sesión persistida por el SDK, logout y navegación ADMIN/EDITOR/USER. Sin login simulado.
- Diseño responsive propio con inspiración retro, ilustraciones SVG neutrales locales, navegación con teclado y estados de carga/error.
- Estética GBA, paleta Poké Ball, tarjetas neutras y fuente VT323 empaquetada localmente. Ver [decisiones visuales y capturas](docs/diseno.md).
- Cuatro productos de demostración, creados por el backend si la tabla de productos está vacía.

**No es un e-commerce:** no hay carrito, checkout, pagos, pedidos, despacho, historial de compras ni cupones. No hay integración con PokéAPI ni consultas de existencia de Pokémon en esta fase.

## Arquitectura

Implementado:

```text
React SPA (:3000) → Amplify Auth → Cognito (sesión/JWT)
React SPA (:3000) → Axios + Access Token → Spring Boot Resource Server (:8081, JWT + RBAC)
                               Controller
                                   ↓
                                Service
                                   ↓
                               Repository
                                   ↓
                                 Entity → SQLite
```

Arquitectura final **planificada**:

```text
Amazon Cognito → JWT → React SPA
                        ├─ HTTP API Gateway + JWT Authorizer → Spring Boot Resource Server → SQLite
                        └─ HTTP API Gateway → AWS Lambda → PokéAPI
```

API Gateway debe poder alcanzar el backend por una dirección accesible desde AWS. El `localhost:8081` de un notebook **no es accesible directamente desde AWS**. La decisión de conectividad para la demo queda pendiente; no se creó ningún túnel, despliegue o recurso cloud.

## Tecnologías y requisitos del equipo

| Herramienta | Versión / requisito |
| --- | --- |
| Java JDK | 17 (probado con Temurin 17.0.15) |
| Maven | 3.9.x (probado con 3.9.10), instalado en PATH |
| Spring Boot | 3.5.11 |
| Hibernate Core y Community Dialects | 6.6.42.Final, alineados por Spring Boot |
| SQLite JDBC | 3.45.1.0, como indica la pauta |
| Node.js | 22.12 o superior; se recomienda la rama 22 LTS (probado con 22.21.0) |
| npm | 10.x (probado con 10.9.4) |
| Frontend | React 19, React Router DOM 7, Axios 1, Vite 7 |

Las versiones exactas del frontend quedan fijadas en `frontend/package-lock.json`. Usar `npm ci` para reproducirlas. No se necesita instalar SQLite por separado: se incluye el driver JDBC. No se requiere Python para ejecutar o probar la aplicación.

## Ejecutar en este PC o en otro notebook

Comprobar primero `java -version`, `mvn -version`, `node --version` y `npm --version`. Los puertos 3000 y 8081 deben estar libres. La instalación inicial necesita acceso a Maven Central y npm.

```sh
git clone https://github.com/JuanBeltranV/tienda-pokepeluche.git
cd tienda-pokepeluche
```

**Nota de entrega:** las Fases 1 y 2 están publicadas. Fase 3 fue validada por el propietario el 29 de septiembre de 2026 y aprobada para publicación en main.

Terminal 1:

```sh
cd backend
mvn clean verify
mvn spring-boot:run
```

Alternativamente, tras compilar:

```sh
java -jar target/pokepeluche-0.1.0.jar
```

Abrir [información pública](http://localhost:8081/api/public/info). Ejecutar siempre desde `backend/` para que la ruta relativa de la base sea consistente.

Terminal 2, desde la raíz del repositorio:

```sh
cd frontend
npm ci
npm run dev
```

Abrir [el catálogo](http://localhost:3000/productos). Vite usa `strictPort`: si 3000 está ocupado, falla en vez de cambiar silenciosamente de puerto.

### Configuración local y futura URL de API

Copia `frontend/.env.example` a `frontend/.env`. Cognito requiere `VITE_COGNITO_USER_POOL_ID` y `VITE_COGNITO_CLIENT_ID`; la plantilla incluye los identificadores públicos proporcionados por el propietario. No añadas contraseñas ni Client Secret. El backend usa por defecto `http://localhost:8081/api`.
Configura `VITE_API_BASE_URL` si necesitas cambiar la API; reinicia Vite después. En una build, la variable se incorpora al compilar. En una fase posterior podrá contener la URL de API Gateway con el prefijo que corresponda a sus rutas.

El backend permite configurar COGNITO_ISSUER_URI y COGNITO_CLIENT_ID como variables del proceso. Los valores públicos de desarrollo ya están en application.properties; no se requiere Client Secret. El decoder hace discovery con Cognito al iniciar, por lo que el arranque necesita conexión. Ver docs/fase-3-resource-server.md.

Las variables `VITE_*` son públicas en el navegador: **no guardar secretos allí**. El backend escucha solo en loopback y CORS permite `http://localhost:3000`, métodos GET/POST/PUT/DELETE/OPTIONS y cabeceras Content-Type/Authorization. CORS no sustituye la autenticación.

### Si Java en Windows informa `Unable to establish loopback connection`

Durante la verificación en este PC, Java 17 falló al crear un socket interno en el directorio temporal de Windows. Se comprobó el arranque usando un directorio relativo para esos sockets, sin cambiar el código ni los puertos:

```sh
java "-Djdk.net.unixdomain.tmpdir=." -jar target/pokepeluche-0.1.0.jar
```

Usar desde `backend/` después de compilar. Con Maven, la opción equivalente es:

```sh
mvn spring-boot:run "-Dspring-boot.run.jvmArguments=-Djdk.net.unixdomain.tmpdir=."
```

Es una alternativa documentada para este fallo del entorno, no una dependencia de rutas de este PC. [Propiedades de sockets de Java 17](https://docs.oracle.com/en/java/javase/17/core/java-networking.html).

## Estructura

```text
backend/
  pom.xml
  src/main/java/cl/pokepeluche/
    config/       # CORS e inicializador
    controller/   # PublicController, ProductController, ContactController
    dto/          # Contratos de entrada/salida y validaciones
    entity/       # Product, Contact
    exception/    # Errores HTTP
    repository/   # Spring Data JPA
    service/      # CRUD y datos de demostración
  src/main/resources/  # application.properties y schema.sql
  src/test/       # Integración con SQLite real temporal
frontend/
  public/images/  # Ilustraciones originales locales
  src/api/        # Axios y servicios HTTP
  src/auth/       # Configuración Amplify, contexto, sesión, protección de rutas y roles
  src/components/
  src/hooks/
  src/lib/
  src/pages/
  src/test/
lambda/           # Solo documentación, sin implementación
docs/             # Requisitos, decisiones, verificación y plan AWS
```

## Modelo de datos

`Product`:

| Campo | Tipo y reglas |
| --- | --- |
| id | Long autogenerado; no se recibe al crear/editar |
| name | Texto obligatorio, máximo 120 caracteres |
| description | Texto obligatorio, máximo 2000 caracteres |
| price | Long, pesos chilenos enteros, de 1 a 999999999 |
| stock | Integer, de 0 a 999999 |
| imageUrl | Ruta local `/images/archivo.svg` (o png/jpg/jpeg/webp) o URL HTTPS, máximo 2048 (imagenes referenciales desde https://dokidokistore.cl/peluches/pokemon-fit (usando la foto de lado frontal)) |
| pokemonId | Integer positivo, obligatorio y único mediante índice SQLite |
| pokemonName | Nombre simple alfanumérico con guiones, máximo 100; normalizado a minúsculas |

Ejemplo de cuerpo POST/PUT:

```json
{
  "name": "Peluche Pikachu 30 cm",
  "description": "Peluche de demostración de 30 cm",
  "price": 19990,
  "stock": 10,
  "imageUrl": "/images/plush-yellow.svg",
  "pokemonId": 25,
  "pokemonName": "pikachu"
}
```

Los decimales en precio/stock/ID y las propiedades desconocidas se rechazan; no se truncan ni se ignoran. El ID interno del producto es distinto de `pokemonId`. La asociación se ingresa manualmente en esta fase; **no verifica existencia ni correspondencia real nombre/ID**. La base solo garantiza una asociación por número.

`Contact`: `id` autogenerado, `name` (100), `email` (254, formato válido), `subject` (150), `message` (3000), `createdAt` UTC generado en el servidor. Todos los textos son obligatorios. Asunto y fecha son decisiones simples añadidas porque la pauta no define atributos. El formulario guarda mensajes, no envía emails. No se añadió bandeja de mensajes al frontend; la lectura se prueba mediante GET.

## Endpoints

Base: `http://localhost:8081/api`. **Backend protegido en Fase 3:** valida firma, issuer, expiración, token_use=access y client_id. Solo GET /api/public/** es público; la siguiente matriz ya se aplica en Spring. Matriz validada manualmente con las tres cuentas reales.

| Método y ruta | Resultado | Permisos aplicados en backend |
| --- | --- | --- |
| GET `/public/info` | 200, información general | Público |
| GET `/products` | 200, lista por número Pokédex | ADMIN, EDITOR, USER |
| GET `/products/{id}` | 200, detalle / 404 | ADMIN, EDITOR, USER |
| POST `/products` | 201, producto y Location | ADMIN |
| PUT `/products/{id}` | 200, producto actualizado / 404 | ADMIN |
| DELETE `/products/{id}` | 204 / 404 | ADMIN |
| POST `/contact` | 201, mensaje guardado | ADMIN, EDITOR, USER |
| GET `/contact` | 200, mensajes más recientes primero | ADMIN, EDITOR |

Validaciones: 400 con `detail` y mapa `errors` por campo; 404 para producto inexistente; 409 para Pokémon duplicado. Se usa `ProblemDetail` para errores conocidos, sin exponer excepciones SQL al cliente. Axios traduce los fallos de comunicación y timeout; los formularios conservan los datos cuando falla el guardado.

## Rutas React

| Ruta | Función actual |
| --- | --- |
| `/login` | Login Cognito, cambio obligatorio de contraseña y errores |
| `/productos` | Tarjetas desde el backend, búsqueda del catálogo local, disponibilidad y orden |
| `/productos/:id` | Datos persistidos y sección Pokédex pendiente |
| `/admin/productos` | Solo ADMIN en frontend: listar, crear, editar y eliminar con confirmación |
| `/contacto` | Enviar mensaje y confirmar persistencia |

Catálogo, detalle y contacto requieren sesión y grupo ADMIN, EDITOR o USER en el frontend. Sin sesión se redirige al login; sin rol permitido se muestra acceso denegado. La búsqueda del catálogo filtra registros ya cargados desde SQLite: no consulta PokéAPI. El campo de imagen recibe una ruta/URL; no se implementó carga de archivos. Si una imagen no carga, se usa un placeholder local. Los SVG son neutrales y provisionales; no representan imágenes oficiales ni definitivas de cada Pokémon.

## SQLite y datos iniciales

`productos_db.db` **no se versiona**: contiene datos locales y mensajes. Hibernate genera tablas con `ddl-auto=update`, y `schema.sql` crea el índice único de `pokemon_id` de forma idempotente después del esquema JPA. Esta operación es necesaria porque SQLite no admite agregar una restricción UNIQUE por ALTER TABLE del modo que intentaba Hibernate.

El inicializador agrega Bulbasaur #1, Charmander #4, Squirtle #7 y Pikachu #25 **solo si la tabla products está vacía**. No rellena productos borrados mientras exista alguno ni modifica productos editados. Si se borran todos, el siguiente arranque vuelve a inicializar los cuatro; se puede evitar con `--app.seed-demo=false` al iniciar el JAR o `SEED_DEMO=false` en el entorno.

Para reconstruir una demo desde cero: detener el backend, guardar una copia de `backend/productos_db.db` si se desean conservar los datos, renombrar ese archivo y reiniciar. Se crea una nueva base con productos; los contactos anteriores permanecen únicamente en la copia. No borrar una base mientras está abierta.

## Verificación

```sh
# En backend/
mvn clean verify

# En frontend/
npm ci
npm run lint
npm test
npm run build
```

Los tests del backend usan un archivo SQLite temporal independiente y no modifican la base de desarrollo. Ver [docs/verificacion.md](docs/verificacion.md) para resultados y una secuencia manual repetible.

## Próximos pasos: Gateway y entrega académica

1. Completado: matriz de seguridad backend validada con los Access Tokens reales de ADMIN, EDITOR y USER.
2. Completado: 200 público, 401 sin token, 403 por rol y CRUD ADMIN; evidencias guardadas por el propietario.
3. Incorporar al informe las evidencias guardadas del Resource Server y los permisos diferenciados de GET `/api/contact`.
4. HTTP API Gateway: integración alcanzable, JWT Authorizer (Issuer/Audience), rutas y CORS.
5. Lambda de validación/normalización de PokéAPI para el formulario de gestión y detalle. No habrá llamadas directas React → PokéAPI. Ver [lambda/README.md](lambda/README.md).
6. Informe Word con capturas AWS, archivos ZIP de frontend/backend y preparación de demo/defensa oral.

La Lambda es una extensión solicitada para este proyecto, no una exigencia explícita de la pauta. Su contrato y la relación con la futura seguridad se describen en [docs/arquitectura.md](docs/arquitectura.md).

No hay contraseñas reales, tokens ni claves AWS en el repositorio. Los identificadores públicos Cognito se incluyen en .env.example. El propietario aprobó commit y push de Fase 3; el despliegue sigue pendiente.
