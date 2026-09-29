# Verificación de Fase 1

Fecha: 27 de septiembre de 2026. Entorno: Windows 11, JDK Temurin 17.0.15, Maven 3.9.10, Node 22.21.0 y npm 10.9.4.

## Pruebas automatizadas

| Verificación | Resultado |
| --- | --- |
| `mvn -B -ntp verify` | Compilación, 11 tests y JAR ejecutable correctos |
| Tests backend con SQLite real temporal | 11 aprobados, sin fallos ni errores |
| `npm ci` desde package-lock.json | Instalación limpia correcta con npm 10.9.4 |
| `npm run lint` | Correcto |
| `npm test` | 8 tests aprobados |
| `npm run build` | Build de producción correcta |
| Auditoría npm tras actualizar Vitest | 0 vulnerabilidades en el árbol completo instalado |

Backend: información pública; CRUD completo; consulta por ID; 404 de lectura/edición/borrado; 409 de duplicación al crear/editar; índice UNIQUE comprobado con INSERT SQL directo; campos inválidos; decimales y propiedades desconocidas; JSON vacío/malformado; contacto inválido/válido y lectura; inicializador idempotente; CORS permitido y origen rechazado. No se sustituyó SQLite por H2 ni por repositorios en memoria.

Frontend: catálogo obtenido del servicio; filtro; recuperación tras error de red; detalle por URL; producto inexistente; formulario conservado ante 409; PUT sin campos de servidor; envío y confirmación de contacto; login deshabilitado sin autenticación ficticia. Estos tests usan mocks de HTTP; la comunicación real se verificó separadamente en navegador.

## Verificación real de la aplicación

- Spring Boot inició en `localhost:8081` y creó el archivo `backend/productos_db.db`.
- React/Vite inició en `localhost:3000`. El navegador mostró cuatro tarjetas procedentes del backend y el detalle de Pikachu con precio, stock y reserva Pokédex.
- Desde `/admin/productos` se creó **Peluche Eevee QA temporal**, Pokémon 133, precio 21990, stock 3.
- Al intentar editar su asociación al Pokémon 25, la UI mostró el conflicto devuelto por el servidor y conservó el formulario.
- Se guardó una edición válida cambiando el stock a 7.
- Desde `/contacto` se envió un mensaje ficticio con asunto **Verificación Fase 1**, usando `demo@example.com`. La interfaz confirmó su guardado; no hubo envío de correo.
- Se inspeccionó directamente SQLite: productos, contacto e índice único presentes; `PRAGMA integrity_check` devolvió `ok`.
- Se detuvo y reinició el proceso Java. El producto temporal conservó stock 7 y no se duplicaron los cuatro productos iniciales.
- Se eliminó únicamente el producto temporal mediante la UI; el catálogo volvió a cuatro productos.
- Se revisaron catálogo, detalle, gestión, contacto y login, así como el diseño de escritorio y móvil. No se implementó ninguna llamada a PokéAPI.

El mensaje ficticio permanece como evidencia en la base local ignorada por Git. Una instalación nueva no contiene mensajes.

Capturas de la versión revisada: [catálogo de escritorio](capturas/catalogo-escritorio.png) y [catálogo móvil](capturas/catalogo-movil.png).

Revisión Git: archivos nuevos marcados como intención de añadir para mostrar el diff; `git diff --check` sin problemas de espacios. Base SQLite, `.env`, node_modules y builds ignorados; `.env.example` incluido. Búsqueda de patrones de claves privadas, tokens GitHub/AWS y JWT sin coincidencias. Sin commit, push ni deploy.

## Problemas detectados y resueltos

1. Hibernate con `ddl-auto=update` no aplicaba UNIQUE en SQLite. La prueba de SQL directo lo detectó. Se añadió `schema.sql` con un índice único idempotente después de JPA; la prueba pasó.
2. Faltaba importar un icono en el catálogo; los tests de React lo detectaron. Importación corregida y ocho tests aprobados.
3. El aislamiento del entorno impedía descargas y algunas lecturas/procesos de compilación. Se solicitaron los permisos de ejecución correspondientes; no se modificó la seguridad del equipo.
4. Java en Windows falló con `Unable to establish loopback connection` al usar sus sockets temporales. Se verificó inicio y reinicio con `java "-Djdk.net.unixdomain.tmpdir=." -jar target/pokepeluche-0.1.0.jar`; alternativa documentada en README.
5. npm 10 presentó un fallo interno `edgesOut` al actualizar Vitest. Se resolvió esa instalación usando npm 11.6.2 temporalmente (`npx --yes npm@11.6.2 install`), sin reemplazar npm del sistema. Después se comprobó `npm ci` con npm 10.9.4. El lockfile permite reproducir el resultado.
6. La auditoría inicial marcó dos alertas moderadas relacionadas con Vitest 3. Se actualizó a 4.1.11; la instalación limpia informó cero vulnerabilidades.
7. La revisión móvil detectó un enlace de cuenta sin etiqueta accesible al ocultar su texto y superposición de la ilustración del login. Ambos corregidos; se reforzó el contraste de textos secundarios.

## Secuencia manual repetible

1. Iniciar backend y frontend como indica README.
2. Abrir `/productos`, comprobar cuatro productos en una base nueva y seleccionar uno.
3. Abrir `/admin/productos`, crear un producto con un pokemonId no utilizado y comprobar su detalle.
4. Intentar crear/editar con un pokemonId ya utilizado: debe aparecer conflicto, sin duplicar datos.
5. Cambiar precio/stock; actualizar la página y reiniciar el backend: los datos deben mantenerse.
6. Cancelar una eliminación y después confirmar la eliminación del registro de prueba.
7. Enviar contacto válido y consultar `GET http://localhost:8081/api/contact`.
8. Probar formularios vacíos, precio/stock negativos y detalle inexistente; esperar errores controlados.
9. Detener el backend y recargar el catálogo: debe aparecer error comprensible y botón de reintento. Reiniciar y reintentar.
10. Abrir `/login`: campos y botón deshabilitados, sin sesión ficticia.

## Límites de esta verificación

No se validó autenticación, autorización, 401/403 de JWT, Cognito, Gateway, Lambda, PokéAPI ni AWS, porque no están implementados en esta fase. La configuración portable y la instalación limpia fueron verificadas en este PC; queda ejecutar la misma secuencia físicamente en el notebook antes de la presentación. No se declara una auditoría completa de accesibilidad ni de seguridad.

## Verificación de Fase 2 (28 de septiembre de 2026)

- Frontend: `npm run lint` correcto; `npm test` con 31 tests aprobados; `npm run build` correcto.
- Backend sin cambios funcionales: `mvn -B -ntp verify`, 11 tests aprobados y JAR generado.
- Dependencia aws-amplify 6.22.1 instalada; npm informó cero vulnerabilidades al instalar.
- Revisión del login local y redirección desde /admin/productos sin sesión. Pruebas automatizadas con SDK simulado, nunca con cuentas AWS reales.
- Los flujos Cognito reales, roles de las cuentas, contraseña temporal, F5 y Bearer deben ser validados por el propietario. No se declara superada esa verificación manual.
- Guía detallada: [Fase 2 Cognito](fase-2-cognito.md). Sin commit ni push de esta fase.
